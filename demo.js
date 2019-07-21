// Demo ------------------------------------------------------

var navs = document.querySelectorAll('.nav-item');
var sections = document.querySelectorAll('.body');
var activates = new Array();

function showTab(link) {
   navs.forEach(function(nav) {
      nav.classList.remove('active');
   });
   sections.forEach(function(section) {
      section.classList.remove('active');
   });
   var navItem = document.querySelector('.nav-item[href="' + link + '"]');
   navItem.classList.add('active');
   document.querySelector(link).classList.add('active');

   if(activates.indexOf(link) === -1) {
      var event = new Event(link + "-event");
      window.dispatchEvent(event);
      activates.push(link);
   }
}

function initializeTabs() {
   var currentUrl = document.URL;
   if(currentUrl.match(/#/)) {
      var link = '#' + currentUrl.split('#')[1];
      if(document.querySelector(link)) {
         showTab(link);
      } else {
         window.history.pushState("", "Parallax", currentUrl.split('#')[0] + '#standard');
         showTab('#standard');
      }
   } else {
      window.history.pushState("", "Parallax", currentUrl.split('#')[0] + '#standard');
      showTab('#standard');
   }
}

window.onload = initializeTabs;

navs.forEach(function(navItem) {
   navItem.addEventListener('click', function() {
      showTab(navItem.getAttribute('href'));
   }.bind(navItem));
});
// -----------------------------------------------------------

// -----------------------------------------------------------+
// Parallax                                                   +
// -----------------------------------------------------------+
var Parallax = {
   normal: function(element, speed = 0.3) {
      this.element = document.querySelector(element);
      this.speed = speed;
      this.elementOffset = 0;

      this.scrollEvent = function() {
         var currentScroll = window.scrollY;

         if(this.elementOffset + this.element.offsetHeight > currentScroll) {
            this.elementOffset = currentScroll * this.speed;
            this.element.style.transform = 'translateY(' + this.elementOffset + 'px)';
         }

      }.bind(this);

      this.start = function() {
         window.addEventListener('scroll', this.scrollEvent);
      }

      this.stop = function() {
         window.removeEventListener('scroll', this.scrollEvent);
      }

      this.start();
   },

   threeD: function(layers) {
      this.layers = layers;
      this.layers.forEach(function(element) {
         element.el = document.querySelector(element.el);
      });
      this.container = this.layers[0].el.parentElement;
      this.size = {
         width: 0,
         height: 0,
      }

      this.updatePosition = function(layer, pos) {
         var element = layer.el;
         var depth = layer.depth;

         var transformPos = {
            x: -50 / depth + pos.x + -pos.x / depth,
            y: -50 / depth + pos.y + -pos.y / depth
         }

         element.style.transform = "translate(" + transformPos.x + "%, " + transformPos.y + "%)";
      }

      this.mouseEvent = function(e) {
         var pos = {
            x: -e.clientX / this.size.width * 100,
            y: -e.clientY / this.size.height * 100
         }

         this.layers.forEach(function(element) {
            this.updatePosition(element, pos);
         }.bind(this));

      }.bind(this);

      this.resize = function() {
         this.size = {
            width: this.container.offsetWidth,
            height: this.container.offsetHeight
         }
      }.bind(this);

      this.init = function() {
         this.container.style.position = "relative";
         this.container.style.height = "100vh";
         this.container.style.width = "100%";
         this.container.style.overflow = "hidden";

         this.resize();

         this.layers.forEach(function(layer) {
            var element = layer.el;
            var depth = layer.depth;

            element.style.position = "absolute";
            element.style.top = "50%";
            element.style.left = "50%";
            element.style.transform = "translate(-50%, -50%)";

            var size = (100 * depth) + '%';

            element.style.width = size;
            element.style.height = size;
            element.style.objectFit = 'cover';
         }.bind(this));

         this.container.addEventListener('mousemove', this.mouseEvent);
         window.addEventListener('resize', this.resize);
      }.bind(this);

      this.init();
   },

   storyLine: function(layers) {
      this.layers = layers;
      this.layers.forEach(function(layer) {
         layer.elName = layer.el;
         layer.el = document.querySelector(layer.el);
         layer.canOnStart = true;
         layer.canOnEnd = true;

         if(layer.options) {
            layer.options = {
               onStartOffset: layer.options.onStartOffset || 0,
               onEndOffset: layer.options.onEndOffset || 0
            };
         } else {
            layer.options = {
               onStartOffset: 0,
               onEndOffset: 0
            };
         }

         var bodyRect = document.body.getBoundingClientRect();
         var elemRect = layer.el.getBoundingClientRect();
         layer.offsetTop   = elemRect.top - bodyRect.top;
      });

      this.scrollHeight = 0;
      this.currentScroll = 0;
      this.windowHeight = 0;
      this.lastScroll = 0;

      this.getLength = function(layer) {
         if(!layer.length) {
            return layer.el.offsetHeight;
         } else {
            var newLenght = layer.length;
            if(typeof(layer.length) === 'string') {
               if(layer.length.match(/vh$/)) {
                  newLenght = Number(layer.length.slice(0, -2));
                  newLenght = this.windowHeight / 100 * newLenght;
               }

               if(layer.length.match(/%$/)) {
                  newLenght = Number(layer.length.slice(0, -1));
                  newLenght = this.scrollHeight / 100 * newLenght;
               }
            }

            return newLenght;
         }
      }

      this.updateEffect = function() {
         this.layers.forEach(function(layer) {
            var onStart = layer.offsetTop - this.windowHeight;
            var onStart_inner = layer.offsetTop;
            var onEnd = onStart + this.getLength(layer) + this.windowHeight;
            var scrollDirection = this.currentScroll < this.lastScroll ? 'up' : 'down';


            if(getComputedStyle(layer.el, null).position === 'fixed') {
               onStart = 0;
               onEnd = this.scrollHeight - this.windowHeight;
            }

            if(this.currentScroll >= onStart && this.currentScroll <= onEnd) {
               var scope = onEnd - onStart;
               var scope_inner = onEnd - onStart_inner;
               var scopeScroll = this.currentScroll - onStart;
               var scopeScroll_inner = this.currentScroll - onStart_inner;
               layer.outerScroll = scopeScroll / scope * 100;
               layer.innerScroll = scopeScroll_inner / scope_inner * 100;
               if(layer.innerScroll < 0) layer.innerScroll = 0;

               layer.update.call(layer);
            }

            if(scrollDirection === 'down' && this.currentScroll >= onStart + layer.options.onStartOffset && layer.canOnStart && layer.onStart) {
               layer.canOnStart = false;
               layer.onStart.call(layer);

            }

            if(scrollDirection === 'down' && this.currentScroll >= onEnd + layer.options.onEndOffset && layer.canOnEnd && layer.onEnd) {
               layer.canOnEnd = false;
               layer.onEnd.call(layer);
            }

            this.lastScroll = this.currentScroll;
         }.bind(this));
      }.bind(this);

      this.resizeEvent = function() {
         this.scrollHeight = document.body.scrollHeight;
         this.windowHeight = window.innerHeight;
      }.bind(this);

      this.scrollEvent = function() {
         this.currentScroll = window.pageYOffset;

         this.updateEffect();
      }.bind(this);

      this.start = function() {
         this.resizeEvent();
         this.scrollEvent();

         window.addEventListener("scroll", this.scrollEvent);
         window.addEventListener("resize", this.resizeEvent);
      }.bind(this);

      this.stop = function() {
         this.scrollWidth = 0;
         this.currentScroll = 0;
         this.windowHeight = 0;
         this.lastScroll = 0;

         window.removeEventListener("scroll", this.scrollEvent);
         window.removeEventListener("resize", this.resizeEvent);
      }.bind(this);

      this.init = function() {
         this.start();

         this.layers.forEach(function(layer) {
            if(layer.onInit) {
               layer.init.call(layer);
            }
         });
      }.bind(this);

      this.init();
   }
}
// -----------------------------------------------------------+
//                                                            +
// -----------------------------------------------------------+

// Standard
var header = new Parallax.normal('#parallax-element img', 0.5);

// 3d
window.addEventListener('#parallax-3d-event', function() {
   var effect = new Parallax.threeD([
      {el: "#l1", depth: 1},
      {el: "#l2", depth: 1.05},
      {el: "#l3", depth: 1.1},
      {el: "#l6", depth: 1.12},
      {el: "#l4", depth: 1.15},
      {el: "#l5", depth: 1.2},
   ]);
});

// Story line
window.addEventListener('#story-line-event', function() {
   var parallax = new Parallax.storyLine([
      {
         el: '#sky',
         length: '120vh',
         update: function() {
            this.el.style.transform = 'translateY(' + (this.innerScroll * 0.6) + '%)';
         }
      },
      {
         el: '#city',
         length: '120vh',
         update: function() {
            this.el.style.transform = 'translateY(' + (this.innerScroll * 0.4) + '%)';
         }
      },
      {
         el: '#trees',
         update: function() {
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.4) + '%)';
         },
         onStart: function() {
            document.querySelectorAll('.layer.hide').forEach(function(element) {
               element.classList.remove('hide');
            });
         },
         options: {
            onStartOffset: 1000
         }
      },
      {
         el: '#street',
         update: function() {
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.4) + '%)';
         }
      },
      {
         el: '#cars-left',
         update: function() {
            var img = document.querySelector(this.elName + " img");
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.4) + '%)';
            img.style.transform = 'translateX(' + (this.outerScroll * 0.6) + '%)';
         }
      },
      {
         el: '#cars-right',
         update: function() {
            var img = document.querySelector(this.elName + " img");
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.4) + '%)';
            img.style.transform = 'translateX(' + (-this.outerScroll * 0.6) + '%)';
         }
      },
      {
         el: '#tracks',
         update: function() {
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.6) + '%)';
         }
      },
      {
         el: '#train',
         update: function() {
            var img = document.querySelector(this.elName + " img");
            this.el.style.transform = 'translateY(' + (this.outerScroll * 0.6) + '%)';
            img.style.transform = 'translateX(' + ((this.outerScroll - 60) * 4) + '%)';
         }
      },
      {
         el: '#loading',
         update: function() {
            document.querySelector('#loading-bar').style.transform = 'scaleX(' + (this.outerScroll / 100) + ')';
            document.querySelector('#loading-text').innerHTML = Math.round(this.outerScroll) + '%';
         },
         onEnd: function() {
            document.querySelector('.end-text.hide').classList.remove('hide');
         }
      }
   ]);
});