/*global window,
    document,
    console
*/


var Modal = function (options) {
    "use strict";

    //Private variables
    //-----------------------------------------
    var self = this,
        i,
        wrapper,
        modalContainer,
        modalWindow,
        modalClose,
        modalContent,
        initialWindowSize,
        newWindowSize,
        sizeDelta,
        cancelDelay = 400, //milliseconds. To prevent doubleclicks accidentally closing the modal


    //Private function names
    //-----------------------------------------
        destroy,
        abort,
        defer,
        enableViewportScroll,
        position,
        resize,
        addButtons,
        cancelAction;


    //Private functions
    //-----------------------------------------
    //Default options
    self.options = {
        type: false, //false|confirm|prompt (adds buttons corresponding to the required functionality of the type
        content: false,
        className: false, //Classname for the modal-window
        displayTime: false, //Time in milliseconds, e.g. 2500, before the popup is automatically closed
        onReady: false, //A function that is executed when the modal has loaded its content, e.g. onReady: function (data) { console.log("onReady", data); }
        callback: false, //A function that is executed upon closing the modal-window, e.g. callback: function (data) { alert("callback: " + data); }
        buttons: true, //Add buttons (depending on the type-property)
        buttonConfirmText: "ok",
        buttonCancelText: "cancel",
        inputFieldType: false,
        inputFieldValue: false,
        inputFieldClass: false,
        margin: 5, //px
        disablePageScroll: true,
        verticalCenter: false,
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

    defer = function (options) {
        options.delay = options.delay || 0;

        if (options.func) {
            window.setTimeout(function () {
                if (self) {
                    console.log("Modal: defer() - enable");
                    try {
                        options.func();
                    } catch (ignore) {}
                }
            }, options.delay);
        }
    };

    enableViewportScroll = function () {
        // Renable page scroll, i.e. revert to external CSS-specifications
        console.log("Reanable viewport scroll");
        //if ((self.options.disablePageScroll === true && popupWindows.length === 0) || popupWindows.length === 0) {
        if (self.options.disablePageScroll) {
            document.getElementsByTagName("body")[0].style.overflow = "";
            document.getElementsByTagName("body")[0].style.marginLeft = "";
        }
    };

    cancelAction = function () {
        if (self.options.type) {
            abort();
        } else {
            destroy();
        }
    };

    destroy = function (data) {
        console.group("Modal: Destroy()");

        enableViewportScroll();

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

        // Fire the callback function
        if (self.options.callback) {
            console.log("Fire callback function");
            self.options.callback(data);
        }

        self = null;

        console.groupEnd();
    };

    abort = function () {
        self.options.callback = false;
        destroy();
    };

    position = function () {
        var viewportWidth = document.documentElement.clientWidth,
            viewportHeight = document.documentElement.clientHeight,
            scrollTop = document.body.scrollTop,
            topPlacement;

        //Center the popup-window horizontally
        modalContainer.style.left = Math.round((viewportWidth / 2) - (modalContainer.offsetWidth / 2)) + "px";

        /* Position the popup-window vertically */
        if (scrollTop === 0) {
            if (window.pageYOffset) {
                scrollTop = window.pageYOffset;
            } else {
                scrollTop = (document.body.parentElement) ? document.body.parentElement.scrollTop : 0;
            }
        }

        // If specified, center the popup-window vertically
        if (self.options.verticalCenter) {
          topPlacement = scrollTop + (Math.round((viewportHeight / 2) - (modalContainer.offsetHeight / 2)));
        } else {
          //or else, place the popup-window towards the top of the screen
          topPlacement = scrollTop + (Math.round((viewportHeight / 4) - (modalContainer.offsetHeight / 4)));
        }

        if ((topPlacement - scrollTop) > self.options.margin) {
          modalContainer.style.top = topPlacement + "px";
        } else {
          modalContainer.style.top = self.options.margin + scrollTop + "px";
        }


    };

    resize = function () {
        var viewportWidth,
            viewportHeight,
            maxWidth,
            maxHeight,
            popupWidth,
            popupHeight;

        //Set proportions of the wrapper to cover the entire page using position:absolute instead of position:fixed (for IE6 and iOS-compatability)
        if (document.documentElement.clientWidth > document.documentElement.scrollWidth) {
            viewportWidth = document.documentElement.clientWidth;
        } else {
            viewportWidth = document.documentElement.scrollWidth;
        }
        wrapper.style.width = viewportWidth + "px";

        if (document.documentElement.clientHeight > document.documentElement.scrollHeight) {
            viewportHeight = document.documentElement.clientHeight;
        } else {
            viewportHeight = document.documentElement.scrollHeight;
        }
        wrapper.style.height = viewportHeight + "px";

        //Calculate the available viewport size
        maxWidth = document.documentElement.clientWidth - (self.options.margin * 2);
        maxHeight = document.documentElement.clientHeight - (self.options.margin * 2);

        //Reset popup size to CSS specifications
        modalContainer.style.width = "";
        modalContainer.style.height = "";

        //Current popup size
        popupWidth = modalContainer.offsetWidth;
        popupHeight = modalContainer.offsetHeight;

        if (popupHeight > maxHeight) {
            modalContainer.style.height = Math.round(maxHeight) + "px";
        }

        if (popupWidth > maxWidth) {
            modalContainer.style.width = Math.round(maxWidth) + "px";
        }

        position();
    };

    addButtons = function () {
        console.group("Modal: addButtons()");

        var buttonReset,
            buttonConfirm,
            theForm,
            theFieldset,
            inputField;

        if (self.options.type === "prompt") {
            //Create and add the form
            theForm = document.createElement("form");
            //theForm.setAttribute("onsubmit", "return validateForm(this)");
            modalContent.appendChild(theForm);

            //Create and add the fieldset
            theFieldset = document.createElement("fieldset");
            theForm.appendChild(theFieldset);

            //Create the input field and add it to the fieldset
            inputField = document.createElement("input");
            if (self.options.inputFieldType) {
                inputField.setAttribute("type", self.options.inputFieldType);
            } else {
                inputField.setAttribute("type", "text");
            }

            inputField.setAttribute("class", "modal-prompt");

            if (self.options.inputFieldClass) {
                inputField.className += " " + self.options.inputFieldClass;
            }
            if (self.options.inputFieldValue) {
                inputField.value = self.options.inputFieldValue;
            }

            theFieldset.appendChild(inputField);
            try {
                inputField.focus();
                inputField.select();
            } catch (ignore) {}
        }

        //Create and add the confirm-button
        if (self.options.type) {
            buttonConfirm = document.createElement('button');
            buttonConfirm.setAttribute("type", "btn btn--submit");
            buttonConfirm.setAttribute("class", "submit");
            buttonConfirm.innerHTML = self.options.buttonConfirmText;
            buttonConfirm.onclick = function () {
                var value = inputField ? inputField.value : false;
                destroy(value);
            };
            modalContent.appendChild(buttonConfirm);
        }


        //Create and add the reset-button
        buttonReset = document.createElement('button');
        buttonReset.setAttribute("type", "button");
        buttonReset.setAttribute("class", "btn btn--reset");
        buttonReset.innerHTML = self.options.buttonCancelText;

        defer({
            func: function () { buttonReset.onclick = cancelAction; },
            delay: cancelDelay
        });

        modalContent.appendChild(buttonReset);

        //Set focus to the cancel button
        if (self.options.type !== "prompt") {
            buttonReset.focus();
        }

        console.groupEnd();
    };

    (function init() {
        console.group("Modal: init()");

        //Check for existing .modal "wrapper" element
        (function prepareElements() {
            var elements = document.getElementsByTagName("div");

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
                defer({
                    func: function () {
                        wrapper.onclick = function () {
                            //Give the wrapper its own closing function to prevent binding it to a certain Modal-objects abort-function

                            enableViewportScroll();
                            wrapper.parentNode.removeChild(wrapper);
                        };
                    },
                    delay: cancelDelay
                });
            }

            //Add the modal-container
            modalContainer = document.createElement("div");
            modalContainer.className = "modal-container";
            wrapper.appendChild(modalContainer);

            //Prevent clicks on the modal-container to bubble up to the modal-window
            modalContainer.onclick = function (event) {
                var e = event || window.event; //get window.event if argument is falsy (in IE)

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
            if(self.options.className) {
                modalWindow.className += " " + self.options.className;
            }
            modalContainer.appendChild(modalWindow);

            //Add the modal-close element
            modalClose = document.createElement("a");
            modalClose.className = "modal-close";
            modalClose.innerHTML = self.options.closeLink;

            defer({
                func: function () {
                    modalClose.onclick = cancelAction;
                },
                delay: cancelDelay
            });

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

        if (self.options.buttons) {
            //Add buttons to the modal-window
            addButtons();
        }

        (function disableViewportScroll() {
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

        (function resizeAndPosition() {
            //Do an initial resize to size and position the content nicely
            resize();

            //Make sure that changes to the viewport size resizes the content
            window.addEventListener("resize", function () {
                resize();
            });

            //Make sure that the modal-wndow is repositioned when scrolling (for iOS)
            window.addEventListener("scroll", function () {
                position();
            });
        }());

        //The modal is loaded and in position, so fire the onReady function
        if (self.options.onReady) {
            console.group("Modal: onReady");
            self.options.onReady({
                element: modalWindow,
                close: destroy //include the close-function so that it's available before the return has been executed
            });
            console.groupEnd();
        }

        (function autoClose() {
            //If the popupWindow is set to auto-close
            if (self.options.displayTime) {
                // Wait for time to pass, and then close the popupWindow while passing on the onClose-function
                defer({
                    func: function () {
                        destroy();
                    },
                    delay: self.options.displayTime
                });
            }
        }());


        console.groupEnd();
    }());


    //Public functions
    //-----------------------------------------
    return {
        options: self.options,
        close: destroy,
        abort: abort,
        element: modalWindow
    };
};