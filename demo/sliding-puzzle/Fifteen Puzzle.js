(function() {
  'use strict';
  var puzzleEle = document.querySelector('.sliding-puzzle.game');
  var start = document.querySelector('.start');
  var solve = document.querySelector('.solve-it');
  var sizeRadios = Array.prototype.slice.apply(document.querySelectorAll('input[name="size"]'));
  var result = document.querySelector('.result-description');
  var userInputN = document.querySelector('.size-n-input input');
  var moveTime = null;
  if (getComputedStyle) {
    moveTime = parseFloat(getComputedStyle(puzzleEle).getPropertyValue('transition-duration')) || 1;
  } else {
    moveTime = 1;
  }
  var started = false;
  var solving = false;
  function Fragment(bgImgCorrectIndex, slidingPuzzleObj) {
    var self = this;
    self['element'] = createElementWith('div', 'fragment');
    self.element['fragmentObj'] = self;
    self['isEmpty'] = false;
    self['bgImgCorrectIndex'] = bgImgCorrectIndex;
    self['slidingPuzzleObj'] = slidingPuzzleObj;
    self['curIndex'] = bgImgCorrectIndex;
    slidingPuzzleObj.fragments.push(self);
  }
  Fragment.prototype = {
    "constructor": Fragment,
    "hide": function() {
      var self = this;
      self.element.classList.add('hidden');
      self.isEmpty = true;
      self.slidingPuzzleObj.hidingFragmentObj = self;
    },
    "show": function() {
      var self = this;
      self.element.classList.remove('hidden');
      self.isEmpty = false;
      self.slidingPuzzleObj.hidingFragmentObj = null;
    },
    "toggle": function() {
      var self = this;
      if (self.isEmpty) self.show();
      else self.hide();
    },
    "indexIsValid": function(index) {
      var self = this;
      return 0 <= index && index < self.slidingPuzzleObj.size;
    },
    "canMoveTo": function(direction) {
      var self = this;
      var resultedCol = self.colIndex + directionMap[direction].x;
      var resultedRow = self.rowIndex + directionMap[direction].y;
      return self.indexIsValid(resultedCol) && self.indexIsValid(resultedRow);
    },
    "getMoveDirection": getMoveDirection,
    "move": move,
    "unmove": unmove,
    "interchange": interchange
  };
  var directionMap = {
    "top": {
      "x": 0,
      "y": -1,
      "opposite": 'bottom'
    },
    "right": {
      "x": 1,
      "y": 0,
      "opposite": 'left'
    },
    "bottom": {
      "x": 0,
      "y": 1,
      "opposite": 'top'
    },
    "left": {
      "x": -1,
      "y": 0,
      "opposite": 'right'
    }
  };
  
  function getIndexInRandomDirection(slidingPuzzleObj, fragmentObj) {
    var possibleIndices = [];
    for (var direction in directionMap) {
      if (!fragmentObj.canMoveTo(direction)) {
        continue;
      }
      var indexAfterMove = slidingPuzzleObj.hidingFragmentObj.curIndex + directionMap[direction].x + directionMap[direction].y * slidingPuzzleObj.size;
      possibleIndices.push({
          "direction": directionMap[direction].opposite,
          "index": indexAfterMove
        });
    }
    var selected = Math.floor(Math.random() * possibleIndices.length);
    return possibleIndices[selected];
  }
  
  function SlidingPuzzle(size) {
    var self = this;
    self['size'] = size;
    self.init();
  }
  SlidingPuzzle.prototype = {
    "constructor": SlidingPuzzle,
    "init": init,
    "win": win,
    "updateCorrectCount": updateCorrectCount,
    "randomize": randomize,
    "back": back,
    "restore": restore
  }

  function init() {
    var self = this;
    self['fragments'] = [];
    self['hidingFragmentObj'] = null;
    self['state'] = {
      "moving": false,
      "randomizing": false,
      "backing": false
    }
    self['correctCount'] = 0;
    self['stepStack'] = [];
    puzzleEle.innerHTML = '';
    var totalWidth = puzzleEle.clientWidth;
    var fragmentWidth = parseInt(totalWidth / self.size);
    var initEmptyIndex = 0; // Math.floor(Math.random() * self.size * self.size);
    var docFrag = document.createDocumentFragment();
    for (var rowIndex = 0; rowIndex < self.size; ++rowIndex) {
      for (var colIndex = 0; colIndex < self.size; ++colIndex) {
        var newFragmentObj = new Fragment(self.correctCount, self);
        setBgPictPos(newFragmentObj, rowIndex, colIndex, fragmentWidth);
        if (self.correctCount == initEmptyIndex) {
          newFragmentObj.hide();
        }
        newFragmentObj.element.addEventListener('click', clickHandler, false);
        docFrag.appendChild(newFragmentObj.element);
        ++self.correctCount;
      }
    }
    puzzleEle.appendChild(docFrag);
    // self.randomize();
  }

  function updateCorrectCount(changedElements) {
    var self = this;
    changedElements.forEach(function(one, index, changedElements) {
      var originResult = (one.curIndex == changedElements[index ^ 1].bgImgCorrectIndex);
      var curResult = (one.curIndex == one.bgImgCorrectIndex);
      self.correctCount += (originResult ^ curResult) * (-2 * originResult + 1);
    });
    // console.log(self.correctCount);
  }
  function win() {
    var self = this;
    return self.correctCount == self.fragments.length;
  }

  function back(callback) {
    var self = this;
    var stepStack = self.stepStack;
    if (!stepStack.length) return false;
    self.state.backing = true;
    var lastStep = stepStack.pop();
    var fragmentObj = self.fragments[lastStep.to];
    var direction = directionMap[lastStep.direction].opposite;
    fragmentObj.move(direction, function afterMoving() {
      fragmentObj.unmove();
      fragmentObj.interchange(self.hidingFragmentObj, direction);
      self.state.backing = false;
      if (callback) callback();
    });
    return true;
  }

  function restore(callback) {
    var self = this;
    function back() {
      if (0 == self.stepStack.length) {
        if (callback) callback();
        return;
      }
      self.back(function() {
        back();
      });
    }
    back();
  }

  function setBgPictPos(fragment, rowIndex, colIndex, width) {
    fragment['rowIndex'] = rowIndex;
    fragment['colIndex'] = colIndex;
    var element = fragment.element;
    element.style.width = width + 'px';
    element.style.height = width + 'px';
    element.style.backgroundPosition = -colIndex * width + 'px ' + -rowIndex * width + 'px';
  }

  function clickHandler(event) {
    if (!started || solving) return;
    var element = this;
    var fragmentObj = element.fragmentObj;
    var slidingPuzzleObj = fragmentObj.slidingPuzzleObj;
    if (slidingPuzzleObj.state.backing) return;
    var direction = fragmentObj.getMoveDirection();
    if (!direction) return;
    fragmentObj.move(direction, function afterMoving() {
      fragmentObj.unmove();
      fragmentObj.interchange(slidingPuzzleObj.hidingFragmentObj, direction);
      if (slidingPuzzleObj.win()) {
        result.classList.add('show');
        setTimeout(function() {
          slidingPuzzleObj.hidingFragmentObj.show();
        }, moveTime * 1000);
        fragmentObj.slidingPuzzleObj.stepStack = [];
        solve.click();
      }
    });
    
  }

  function getMoveDirection() {
    var self = this;
    var slidingPuzzleObj = self.slidingPuzzleObj;
    for (var direction in directionMap) {
      if (!self.canMoveTo(direction)) {
        continue;
      }
      var indexOffset = directionMap[direction].x + directionMap[direction].y * self.slidingPuzzleObj.size;
      if (self.curIndex + indexOffset == slidingPuzzleObj.hidingFragmentObj.curIndex) {
        return direction;
      }
    }
    return undefined;
  }

  function interchange(another, direction) {
    var self = this;
    var element = self.element;
    var slidingPuzzleObj = self.slidingPuzzleObj;
    propInterchange(self, another, ['bgImgCorrectIndex']);
    propInterchange(element.style, another.element.style, ['backgroundPosition']);

    function propInterchange(selfBody, anotherBody, props) {
      var temp = null;
      props.forEach(function(one) {
        temp = selfBody[one];
        selfBody[one] = anotherBody[one];
        anotherBody[one] = temp;
      });
    }
    var isReverse = false;
    if (slidingPuzzleObj.state.randomizing && slidingPuzzleObj.stepStack.length) {
      var last = slidingPuzzleObj.stepStack[slidingPuzzleObj.stepStack.length - 1];
      isReverse = (direction == directionMap[last.direction].opposite &&
                      last['from'] == another.curIndex && last['to'] == self.curIndex);
      if (isReverse) {
        slidingPuzzleObj.stepStack.pop();
      }
    }
    if (!isReverse && !slidingPuzzleObj.state.backing) {
      slidingPuzzleObj.stepStack.push({
        "from": self.curIndex,
        "to": another.curIndex,
        "direction": direction
      });
    }
    self.toggle(), another.toggle();
    slidingPuzzleObj.updateCorrectCount([self, another]);
    slidingPuzzleObj.hidingFragmentObj = self;
  }

  function move(direction, callback) {
    var self = this;
    var element = self.element;
    var slidingPuzzleObj = self.slidingPuzzleObj;
    if (slidingPuzzleObj.state.moving) return;
    var randomizing = slidingPuzzleObj.state.randomizing;
    slidingPuzzleObj.state.moving = direction;
    if (randomizing) {
      self.interchange(slidingPuzzleObj.hidingFragmentObj, direction);
      slidingPuzzleObj.state.moving = false;
      return;
    }
    element.parentNode.classList.add('moving');
    var x = directionMap[direction].x * (element.clientWidth + 2);
    var y = directionMap[direction].y * (element.clientWidth + 2);
    element.style.transform += 'translate(' + x + 'px, ' + y + 'px)';
    setTimeout(function afterMoving() {
      element.parentNode.classList.remove('moving');
      slidingPuzzleObj.state.moving = false;
      callback.apply(element);
    }, moveTime * 1000);
    
  }

  function unmove() {
    var self = this;
    var element = self.element;
    var translateIndex = self.element.style.transform.indexOf('translate');
    if (-1 == translateIndex) translateIndex = undefined;
    self.element.style.transform = self.element.style.transform.slice(0, translateIndex);
  }

  function randomize() {
    var self = this;
    self.state.randomizing = true;
    var times = Math.floor(30 + Math.random() * randomTime);
    for (var timesCount = 0; timesCount < times; ++timesCount) {
      var hidingFragmentObj = self.hidingFragmentObj;
      var randomResult = getIndexInRandomDirection(self, hidingFragmentObj);
      var randomSelectedOne = self.fragments[randomResult.index];
      randomSelectedOne.move(randomResult.direction);
      if (self.win()) {
        self.stepStack = [];
      }
    }
    if (self.win()) {
      setTimeout(function() {
        self.randomize();
      });
    }
    self.state.randomizing = false;
  }
  var config = {};
  if (localStorage.slidingPuzzle) {
    try {
      config = JSON.parse(localStorage.getItem('slidingPuzzle'));
    } catch (e) {
      config = {};
    }
  }
  var size = config.size || 4;
  var limit = 8;
  config.size = size;
  localStorage.setItem('slidingPuzzle', JSON.stringify(config));
  var randomTime = getRandomTime();
  window.slidingPuzzle = new SlidingPuzzle(size);

  function getRandomTime() {
    var ret = Math.pow(5, size);
    var max = 1000;
    if (ret > max) {
      ret = max;
    }
    return ret;
  }
  
  start.addEventListener('click', function() {
    if (started && slidingPuzzle.state.backing) {
      return;
    }
    slidingPuzzle.init();
    slidingPuzzle.randomize();
    puzzleEle.classList.add('started');
    result.classList.remove('show');
    solve.disabled = undefined;
    started = true;
  }, false);
  solve.disabled = true;
  solve.addEventListener('click', function() {
    if (!started || solving || slidingPuzzle.state.backing) return;
    start.disabled = true;
    solving = true;
    sizeRadios.forEach(function(one) {
      one.disabled = true;
    });
    userInputN.disabled = true;
    slidingPuzzle.restore(function() {
      started = false;
      solving = false;
      start.disabled = undefined;
      userInputN.disabled = undefined;
      solve.disabled = true;
      puzzleEle.classList.remove('started');
      sizeRadios.forEach(function(one) {
        one.disabled = undefined;
      });
    });
  }, false);

  sizeRadios.forEach(function(one, index, self) {
    one.slidingPuzzleSize = parseInt(one.id.substring('size-'.length));
    if (isNaN(one.slidingPuzzleSize)) {
      userInputN['SlidingPuzzleRadio'] = one;
    }
    if (one.slidingPuzzleSize == config.size
        || (index + 1 == self.length && config.size && config.size > 5)) {
      one.checked = true;
    }
    one.addEventListener('click', changeSize, false);
  });

  function changeSize() {
    slidingPuzzle.size = config.size = size = this.slidingPuzzleSize || config.size;
    randomTime = getRandomTime();
    localStorage.setItem('slidingPuzzle', JSON.stringify(config));
    slidingPuzzle.init();
    result.classList.remove('show');
  }
  
  userInputN.addEventListener('change', function() {
    var newSize = parseInt(this.value);
    if (this.value.length == 0) {
      return;
    }
    var invalid = false;
    if (isNaN(newSize) || newSize <= 1 || Math.floor(this.value) != newSize) {
      invalid = 'Invalid Number';
    } else if (newSize > limit) {
      invalid = 'Too hard for you';
    }
    if (invalid) {
      this.value = invalid;
      this.select();
      return;
    }
    this.SlidingPuzzleRadio.slidingPuzzleSize = newSize;
    if (this.SlidingPuzzleRadio.checked) {
      this.SlidingPuzzleRadio.click();
    }
  }, false);



  /** 
    * Create an element of tagName type, optionally add classes and append Nodes to the newly created element
    * @param {string} tagName
    * @param {(string | string[] )} [classList] - a class or an array of classes
    * @param {(string | Node[] | string[] )} [children] - a string or an array of string or an array of Nodes
    * @return {Node} the created element
    * independent
    */
  function createElementWith(tagName, classList, children) {
    var newElement = document.createElement(tagName);
    if (classList === undefined) return newElement;

      // wrap to an array
    if (typeof(classList) === 'string') {
      classList = new Array(classList);
    }
    classList.forEach(function(oneClass) {
      newElement.classList.add(oneClass);
    });
    if (children === undefined) return newElement;

      // wrap to an array
    if ( Object.prototype.toString.apply(children) != '[object Array]' || typeof(children) === 'string' ) {
      children = new Array(children);
    }
    children.forEach(function(oneChild) {
      if ( !(oneChild instanceof Node) ) oneChild = document.createTextNode(String(oneChild));
      newElement.appendChild(oneChild);
    });
    return newElement;
  }
})();
