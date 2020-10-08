# What is this?

An experiment demonstrating offscreen canvas and
providing a fun little hackable 'framework' for creating
variants and sharing interesting results. You
provide a 'goal image' and optionally configure few
other things. A small population of 'individuals'
are created, each with their own 'genes'. Each
of these is painted onto a canvas and compared to
the original image to guage their 'fitness' toward the goal
(lower scores are better). Information about this
is reported back and the next generation is created
through some kind of preference toward fitness and
imperfect copying. The cycle repeats, allowing us
to observe the basic idea of evolution's fundamental
ideas play out.

You can view one experiment run by clicking 'show live' above.

# What's the deal with OffscreenCanvas?

As you might imagine, this involves kind of a lot of 'work'.
Painting genes onto every canvas in a population and then
comparing them to a goal somehow takes a bit. The later
requires us looking at data for every pixel, for every
individual in the population, every generation. As
an observer from the outside, what we want to see is only
the fittest one each generation and some information about it.

_Most_ of this work seems ideal to do _in a worker_, off the
main thread. However, workers are sandboxed and don't have
access to DOM, and, until now that meant you couldn't really
work with canvases in workers. OffscreenCanvas and the ability
to transfer control of a canvas to an offscreen worker are
the key here. This means that (if your browser supports OffscreenCanvas)
the only work on the main thread is 'paint the fittest one' and
'receive a little information about it' - all the rest of the
work is happening in a worker and not blocking up the main page.

## Hackable architecture

I come back to these experiments from time to time and, while
they can be fun, it's easy to get confused if things are all
lumped together. These sorts of things generally involve dealing
with things at pretty low levels - similar arrays of
abstract meanings, understanding something about how images work and
so on. I'd like to make it easier for me, and maybe you, to hack
around without needing to know all of that.

Things are broken down into several modules, most of them are 
pretty small so if you view them I guess you should get a sense, 
and remix this glitch you can edit them easily.

- starting from the highest:

- *evo-pop-worker.js*:  It's really just trying to be an adapter that works
as a module or worker. I'm not sure this particular abstraction makes sense.

- *evo-population.js*: This is really the first abstraction and it represents 
the population. It allows you to create a population with a config. 
Key bits of config are: a goal image, a callback it will use to tell you info at the 
end of a generation, and a painter module name.

- *painter modules*: I have 3 modules here to show the idea - they are 
all named with the pattern `{something}-gene-painter`.  The only one I 
really know is decent is `rectangle-gene-painter.js`, but you can see how 
small they are, a few lines.  The idea is that you are given 8 arguments 
that consitute data a single gene. Each of these arguments is an unsigned
integer 0...255.  The function's job is simply to use some or all of this 
data to draw something on the canvas. That's it. These functions are 
called with the 'this' context of an `evo-canvas`.  It's just a normal 
Canvas (maybe offscreen), but it has additional `.ctx` property that is 
already the 2d context and `.xUnit` and `.yUnit` which gives you a number
representing 1/256th the width or height which you can use, without
having to do math, if that's useful (hint, it often it).


* *evo-canvas.js* - It's just a class that contains a canvas, genetics about it,
and containssome additional shortcuts, a pattern for calling the painter modules and
and a universal fitness function.


* _genetics.js_: Provides a simple abstraction about genetics that allow you to 
create and use different length 'octo-genes' reasonably efficiently and mutate them
without having to get too deep into knowing how any of it really works.
