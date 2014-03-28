/*global window,
    document,
    console
*/


var Modal = function (options) {
    "use strict";

    //Private variables
    var self = this,
        i,
        wrapper,
        modalContainer,
        modalWindow,
        modalClose,
        modalContent,
        initialWindowSize,
        newWindowSize,
        sizeDelta;

    //Private function names
    var init,
        destroy,
        abort;

    //Private functions
    //Default options
    self.options = {
        //type: false,
        content: false,
        //className: false,
        //displayTime: false,
        //element: false,
        //onClose: function () {},
        //buttonConfirmText: "ok",
        //buttonCancelText: "cancel",
        //inputFieldType: false,
        //inputFieldValue: false,
        //inputFieldClass: false,
        //margin: 5, //px
        disablePageScroll: true,
        //verticalCenter: false,
        //showLoader: false,
        //loaderMessage: false
        closeLink: "<span>Close <span class=\"hotkey\">(esc)</span></span>"
    };

    /* User defined options */
    if (typeof options === 'object') {
        for (i in options) {
            if (options.hasOwnProperty(i)) {
                self.options[i] = options[i];
            }
        }
    }

    destroy = function (e) {
        console.group("Modal: Destroy()");

        (function reanableViewportScroll () {
            // Renable page scroll, i.e. revert to external CSS-specifications
            console.log("Reanable viewport scroll");
            //if ((self.options.disablePageScroll === true && popupWindows.length === 0) || popupWindows.length === 0) {
            if (self.options.disablePageScroll) {
                document.getElementsByTagName("body")[0].style.overflow = "";
                document.getElementsByTagName("body")[0].style.marginLeft = "";
            }
        }());

        (function removeModalWindow () {
            console.log("Remove modal window from DOM");
            wrapper.removeChild(modalContainer);
        }());

        (function removeModalFromDOM () {
            //If no more modal-windows are present, remove the wrapper
            if (wrapper.childNodes.length === 0) {
                console.log("Remove modal from DOM");
                document.getElementsByTagName("body")[0].removeChild(wrapper);
            }
        }());

        // Fire the onClose function
        console.log("Fire onClose function (which can have been nullified)");
        self.options.onClose(e);

        console.groupEnd();
    };

    abort = function () {
        self.options.onClose = function () {};
        destroy();
    };

    (function init() {

        //Check for existing .modal "wrapper" element
        (function prepareElements() {
            var elements = document.getElementsByTagName("div"),
                i;

            for (i = 0; i < elements.length; i += 1) {
                if (elements[i].className.indexOf('modal') > -1) {
                    //console.log("wrapper found", elements[i])
                    wrapper = elements[i];
                    break;
                }
            }

            //If a wrapper doesn't exist create a new one
            if (!wrapper) {
                //create a new wrapper element
                wrapper = document.createElement("div");
                wrapper.className = "modal";

                //Add the wrapper to the DOM
                document.getElementsByTagName("body")[0].appendChild(wrapper);
            }

            console.log("wrapper", wrapper);
            if (!wrapper.onclick) {
                wrapper.onclick = function () {
                    //Give the wrapper its own closing function to prevent binding it to a certain Modal-objects abort-function
                    wrapper.parentNode.removeChild(wrapper);
                };
            }


            //Add the modal-container
            modalContainer = document.createElement("div");
            modalContainer.className = "modal-container";
            wrapper.appendChild(modalContainer);

            // Prevent clicks on the popupContainer to bubble up to the popupWindow
            modalContainer.onclick = function (event) {
                var e = event || window.event; //get window.event if argument is falsy (in IE)

                //console.log(e.stopPropagation);

                if (e.stopPropagation) {
                    //For all the clever browsers
                    //e.preventDefault();
                    e.stopPropagation();
                } else {
                    //For IE
                    //e.returnValue = false;
                    e.cancelBubble = true;
                }
            };


            //Add the modal-window
            modalWindow = document.createElement("div");
            modalWindow.className = "modal-window";
            modalContainer.appendChild(modalWindow);

            //Add the modal-close element
            modalClose = document.createElement("a");
            modalClose.className = "modal-close";
            modalClose.innerHTML = self.options.closeLink;
            modalClose.onclick = abort;
            modalWindow.appendChild(modalClose);

            // Add the modal-content
            modalContent = document.createElement('div');
            modalContent.className = "modal-content";
            modalWindow.appendChild(modalContent);

        }());

        (function setContent() {
            if (self.options.content) {
              modalContent.innerHTML = self.options.content;
            } else {
              modalContent.innerHTML = "";
            }
        }());

        (function disableViewportScroll () {
            // Disable page scroll
            //if (this.options.disablePageScroll === true && popupWindows.length === 1) {
            if (self.options.disablePageScroll === true) {
                initialWindowSize = document.documentElement.scrollWidth;

                //Remove the scrollbars on supported browsers (i.e. not Internet Explorer 6)
                document.getElementsByTagName("body")[0].style.overflow = "hidden";

                //Calculate the difference between the window-size before and after "overflow: hidden"
                newWindowSize = document.documentElement.scrollWidth;
                sizeDelta = initialWindowSize - newWindowSize;

                //Move the entire page left to compensate for missing scroll-bars to make sure that the content stays in the same place
                sizeDelta = (sizeDelta === 0 ? sizeDelta : sizeDelta + "px");
                document.getElementsByTagName("body")[0].style.marginLeft = sizeDelta;
            }
        }());

        /*(function showLoader() {
            if (self.options.showLoader) {
                if (self.options.loaderMessage) {
                    popupContent.innerHTML = self.options.loaderMessage;
                }
                modalContent.appendChild(window.ajaxLoader);
            }
        }());*/


    }());


    //Public functions
    return {
        options: self.options,
        close: destroy,
        abort: abort
    };
};