Anim = (function() {
    var mergeState = function(state1, state2) {
        state2.lines.forEach(function(line) {
            state1.lines.push(line);
        });
        return state1;
    }

    var doneFunc = function(duration) {
        if (typeof duration === 'undefined'){
            throw new Error("duration not defined")
        }
        return duration > this.duration();
    };

    var LineAnim = function(start, end, duration, remain) {
        //start and end are [x1%, y1%, x2%, y2%]
        // duration is how long we transition from start to end
        // remain is if we keep the line after duration is finished or delete it
        this.start = start;
        this.end = end;
        this.totDuration = duration;
        this.remain = remain;
    };
    LineAnim.prototype.get = function(duration) {
        var perc = duration / this.totDuration;
        if (perc <= 1) {
            return {
                lines: [
                    [
                        this.start[0] * (1 - perc) + this.end[0] * perc,
                        this.start[1] * (1 - perc) + this.end[1] * perc,
                        this.start[2] * (1 - perc) + this.end[2] * perc,
                        this.start[3] * (1 - perc) + this.end[3] * perc,
                    ]
                ]
            }
        } else {
            if (this.remain) {
                return {
                    lines: [this.end]
                }
            } else {
                return {
                    lines: []
                }
            }
        }
    }
    LineAnim.prototype.done = doneFunc;
    LineAnim.prototype.duration = function() {
        return this.totDuration;
    }

    var SimulAnim = function(animations, duration, remain) {
        this.animations = animations;
        this.remain = remain;
    };
    SimulAnim.prototype.get = function(duration) {
        var state = {
            lines: []
        };
        this.animations.forEach(function(anim) {
            if (!anim.done(duration) || anim.remain) {
                var stateToAdd = anim.get(duration);
                stateToAdd.lines.forEach(function(line) {
                    state.lines.push(line);
                });
            }
        });
        return state;
    }
    SimulAnim.prototype.done = doneFunc
    SimulAnim.prototype.duration = function() {
        var d = 0;
        this.animations.forEach(function(anim) {
            d = Math.max(d, anim.duration());
        });
        return d;
    }

    var ConsecAnim = function(animations, duration, remain) {
        this.animations = animations;
        this.lastStart = 0;
        this.remain = remain;
    };
    ConsecAnim.prototype.get = function(duration) {
        var currState = {
            lines: []
        }
        for (var i = 0; i < this.animations.length; i++) {
            var d = this.animations[i].duration();
            if (duration > d) {
                if (this.animations[i].remain) {
                    var addState = this.animations[i].get(duration);
                    currState = mergeState(currState, addState);
                }
                duration -= d;
            } else {
                var addState = this.animations[i].get(duration);
                currState = mergeState(currState, addState);
                break;
            }
        }
        return currState;
    }
    ConsecAnim.prototype.done = doneFunc;
    ConsecAnim.prototype.duration = function() {
        var d = 0;
        this.animations.forEach(function(anim) {
            d += anim.duration();
        });
        return d;
    }

    var WaitAnim = function(duration) {
        this.totDuration = duration;
    };
    WaitAnim.prototype.get = function() {
        return {
            lines: []
        };
    };
    WaitAnim.prototype.done = doneFunc;
    WaitAnim.prototype.duration = function() {
        return this.totDuration;
    };

    var RepeatAnim = function(animation, repeats, duration, remain) {
        this.animation = animation;
        this.repeats = repeats;
        this.remain = remain;
    };
    RepeatAnim.prototype.get = function(duration) {
        var actualDur = this.animation.duration()
        if (duration/actualDur > this.repeats) {
            return this.animation.get(duration-(actualDur*(this.repeats-1)));
        } else {
            return this.animation.get(duration % actualDur);
        }
    };
    RepeatAnim.prototype.done = doneFunc;
    RepeatAnim.prototype.duration = function() {
        return this.animation.duration()*this.repeats;
    };

    var ReverseAnim = function(animation, duration, remain) {
        this.animation = animation;
        this.remain = remain;
    };
    ReverseAnim.prototype.get = function(duration) {
        return this.animation.get(Math.max(0, this.duration()-duration))
    };
    ReverseAnim.prototype.done = doneFunc;
    ReverseAnim.prototype.duration = function() {
        return this.animation.duration();
    };

    var FinalAnim = function(animation, duration, remain) {
        this.animation = animation;
        this.remain = remain;
    }
    FinalAnim.prototype.get = function(){
        return this.animation.get(this.animation.duration());
    }
    FinalAnim.prototype.done = doneFunc;
    FinalAnim.prototype.duration = function() {
        return 0;
    };

    return  {
      Line: LineAnim,
      Simul: SimulAnim,
      Consec: ConsecAnim,
      Wait: WaitAnim,
      Repeat: RepeatAnim,
      Reverse: ReverseAnim,
      Final: FinalAnim,
    }
})()