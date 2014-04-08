/*******************************************************************************
Copyright (c) Adam Barry, www.adambarry.dk

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
--------------------------------------------------------------------------------

Name:
Modality script

--------------------------------------------------------------------------------
Description:
Function that enable an integrated modal (popup) window which overlays the
"normal" page content.

--------------------------------------------------------------------------------
Usage:
Simply place a link to the this script in the the HTML page. The script will
then automatically execute when the related Modality-constructor is subsequently
invoked.

--------------------------------------------------------------------------------
Example:

<script type="text/javascript" src="modality.js"></script>

--------------------------------------------------------------------------------
Options:

--------------------------------------------------------------------------------
Dependencies:
None

*******************************************************************************/

//JSLint stuff:
/*global window,
    document,
    console
*/


var Modality = function (options, evt) {
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
        cancelDelay = 400, //milliseconds. To prevent doubleclicks accidentally closing the modal,
        cancelCounter = false, //Counter used for showing remaining visible time for time Modality-windows
        triggerElement = false, //Element that triggered the Modality-window
        buttonReset,


    //Private function names
    //-----------------------------------------
        destroyActions,
        destroy,
        abort,
        defer,
        enableViewportScroll,
        position,
        resize,
        addButtons,
        cancelAction,
        update,
        countdown,
        focus;


    //Private functions
    //-----------------------------------------

    //Default options
    self.options = {
        type: false, //false|confirm|prompt (adds functionality corresponding to the type)
        content: false, //The HTML contents of the modalWindow
        className: false, //Classname for the modalWindow
        time: false, //Time in milliseconds, e.g. 2500, before the popup is automatically closed.
        timeSec: "second", //Label for remaining second (single)
        timeSecs: "seconds", //Label for remaining seconds (plural)
        onReady: false, //A function that is executed when the modal has loaded its content, e.g. onReady: function (data) { console.log("onReady", data); }
        callback: false, //A function that is executed upon closing the modalWindow, e.g. callback: function (data) { alert("callback: " + data); }
        buttons: true, //Add buttons (depending on the type-property)
        buttonCloseText: "close", //Text for cancel/close button
        buttonCancelClass: "btn btn--secondary",
        buttonConfirmText: "ok", //Text for ok/confirm button
        buttonConfirmClass: "btn btn--primary",
        inputFieldType: false, //For type === "confirm"
        inputFieldClass: false, //For type === "confirm"
        inputFieldPlaceholder: false, //For type === "confirm"
        inputFieldValue: false, //For type === "confirm"
        formFieldFocus: true,
        margin: 5, //Minimum distance in px between the viewport border and the modalWindow. ModalWindow will shrink when too little space
        disablePageScroll: true, //When set to true, body.style.overflow will be set to hidden, while modalWindows are active
        verticalCenter: false, //When set to true, the popupWindow will be centered vertically, instead of being placed towards the top of the screen
        fadeTime: 250, //Milliseconds for CSS3-based fade-in/out for the "modality" element
        fadeHiddenClass: "Modality--hidden",
        closeLink: "<span>Close <span class=\"hotkey\">(esc)</span></span>" //Contents of permanent close button for the Modality-window
    };

    //User defined options
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
                    console.log("Modality: defer()");
                    try {
                        options.func();
                    } catch (ignore) {}
                }
            }, options.delay);
        }
    };

    enableViewportScroll = function () {
        // Re-enable page scroll, i.e. revert to external CSS-specifications
        console.log("Reanable viewport scroll");
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

    destroyActions = function () {
        self = null;

        try {
            window.clearTimeout(cancelCounter);
        } catch (ignore) {}

        //Restore focus to the triggerElement
        try {
            if (triggerElement) {
                triggerElement.focus();
            }
        } catch (ignore) {}
    };

    destroy = function (data) {
        console.group("Modality: Destroy()");

        enableViewportScroll();

        (function removeModalWindow () {
            console.log("Remove modal window from DOM");
            wrapper.removeChild(modalContainer);
        }());

        (function removeModalFromDOM () {
            //If no more Modality-windows are present, remove the wrapper
            if (wrapper.childNodes.length === 0) {
                wrapper.className += " " + self.options.fadeHiddenClass;

                window.setTimeout(function () {
                    console.log("Remove modal from DOM");
                    document.getElementsByTagName("body")[0].removeChild(wrapper);
                }, self.options.fadeTime);
            }
        }());

        //Fire the callback function
        if (self) {
            if (self.options.callback) {
                console.log("Fire callback function");
                self.options.callback(data);
            }
        }

        destroyActions();

        console.groupEnd();
    };

    abort = function () {
        self.options.callback = false;
        destroy();
    };

    position = function () {
        if (!self) { return false; }

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
        if (!self) { return false; }

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

    update = function (html) {
        console.group("Modality: update()");

        modalContent.innerHTML = html;

        if (self.options.buttons) {
            addButtons();
        }

        resize();

        console.groupEnd();
    };

    countdown = function (obj) {
        var refreshRate = 500, //Milliseconds
            initialTime = self.options.time,
            buttonText,
            updateCounter,
            timer,
            sec = false,
            secs = false;

        console.log("Modality: countdown()");

        if (!obj.element) { return false; }

        buttonText = obj.element.innerHTML;

        if (self.options.timeSec || self.options.timeSecs) {
            sec = self.options.timeSec ? " " + self.options.timeSec : "";
            secs = self.options.timeSecs ? " " + self.options.timeSecs : "";
        }

        updateCounter = function () {
            var remainingSecs = Math.round(initialTime / 1000),
                remainingSecsText = "";

            if (sec|| secs) {
                remainingSecsText = (remainingSecs === 1) ? sec : secs;
            }

            obj.element.innerHTML = buttonText + " (" + remainingSecs + remainingSecsText + ")";
            initialTime -= refreshRate;
        };

        timer = function () {
            updateCounter();

            cancelCounter = window.setTimeout(function () {
                timer();
            }, refreshRate);
        };

        if (self.options.time === initialTime) {
            timer();
        }
    };

    focus = function () {
        var elements = modalWindow.getElementsByTagName("*"),
            element = false;

        //Set focus to the first form element that isn't hidden
        for (i = 0; i < elements.length; i += 1) {
            if (elements[i].tagName.toLowerCase() === "input" || elements[i].tagName.toLowerCase() === "select" || elements[i].tagName.toLowerCase() === "textarea") {
                if (elements[i].getAttribute("type") !== "hidden") {
                    elements[i].focus();
                    elements[i].select();
                    element = true;
                    break;
                }
            }
        }

        //if no element has received focus, set focus to the cancel button
        if (!element) {
            try {
                buttonReset.focus();
            } catch (ignore) {}
        }
    };

    addButtons = function () {
        console.group("Modality: addButtons()");

        var formSubmit,
            buttonConfirm,
            theForm,
            theFieldset,
            inputField;

        formSubmit = function (e) {
            //console.log("form", this);

            //Prevent the submit action from performing a postback
            e.preventDefault();

            var value = inputField ? inputField.value : false;

            //Close the Modality-window and send the inputField-value to the onClose-function
            destroy({
                value: value
            });
        };

        //As we have buttons we should also have a form
        (function () {
            //Create and add the form
            theForm = document.createElement("form");
            //theForm.setAttribute("onsubmit", "return validateForm(this)");
            theForm.onsubmit = formSubmit;
            modalContent.appendChild(theForm);
        }());

        if (self.options.type === "prompt") {
            //Create and add the fieldset
            theFieldset = document.createElement("fieldset");
            theFieldset.className = "Modality-fieldset";
            theForm.appendChild(theFieldset);

            //Create the input field and add it to the fieldset
            inputField = document.createElement("input");
            inputField.setAttribute("required", "required");

            if (self.options.inputFieldType) {
                inputField.setAttribute("type", self.options.inputFieldType);
            } else {
                inputField.setAttribute("type", "text");
            }

            inputField.setAttribute("class", "Modality-prompt");

            if (self.options.inputFieldClass) {
                inputField.className += " " + self.options.inputFieldClass;
            }
            if (self.options.inputFieldPlaceholder) {
                inputField.setAttribute("placeholder", self.options.inputFieldPlaceholder);
            }
            if (self.options.inputFieldValue) {
                inputField.value = self.options.inputFieldValue;
            }

            theFieldset.appendChild(inputField);
        }

        //Create and add the confirm-button
        if (self.options.type) {
            buttonConfirm = document.createElement('button');
            buttonConfirm.setAttribute("type", "submit");
            if (self.options.buttonConfirmClass) {
                buttonConfirm.setAttribute("class", self.options.buttonConfirmClass);
            }
            buttonConfirm.innerHTML = self.options.buttonConfirmText;
            theForm.appendChild(buttonConfirm);
        }


        //Create and add the reset-button
        buttonReset = document.createElement('button');
        buttonReset.setAttribute("type", "button");
        if (self.options.buttonCancelClass) {
            buttonReset.setAttribute("class", self.options.buttonCancelClass);
        }
        buttonReset.innerHTML = self.options.buttonCloseText;

        defer({
            func: function () { buttonReset.onclick = cancelAction; },
            delay: cancelDelay
        });

        if (self.options.time) {
            countdown({
                element: buttonReset
            });
        }

        theForm.appendChild(buttonReset);

        //Set focus to the relevant form element
        if (self.options.formFieldFocus) {
            defer({
               func: function () {
                   focus();
               },
               delay: self.options.fadeTime
            });
        } else {
            buttonReset.focus();
        }

        console.groupEnd();
    };

    (function init() {
        console.group("Modality: init()");

        (function removeFocusFromTrigger () {
            var event = evt || window.event; //get window.event if argument is falsy (in IE)

            if (event) {
                triggerElement = event.target || event.srcElement;

                triggerElement.blur();
            }
        }());

        //Check for existing .modal "wrapper" element
        (function prepareElements() {
            var elements = document.getElementsByTagName("div");

            for (i = 0; i < elements.length; i += 1) {
                if (elements[i].className === "Modality") {
                    //console.log("wrapper found", elements[i])
                    wrapper = elements[i];
                    break;
                }
            }

            //If a wrapper doesn't exist create a new one
            if (!wrapper) {
                //create a new wrapper element
                wrapper = document.createElement("div");
                wrapper.className = "Modality";
                wrapper.className += " " + self.options.fadeHiddenClass;

                //Add the wrapper to the DOM
                document.getElementsByTagName("body")[0].appendChild(wrapper);

                //Make sure that the fade-in transition starts after the element has been added to the DOM, i.e. on nextTick
                defer({
                   func: function () { wrapper.className = "Modality"; }
                });
            }

            console.log("wrapper", wrapper);

            (function () {
                //Store the fadeTime variable as 'self' may not exist any longer when the wrapper is clicked
                var fadeTime = self.options.fadeTime,
                    fadeHiddenClass = self.options.fadeHiddenClass;

                if (!wrapper.onclick) {
                    defer({
                        func: function () {
                            wrapper.onclick = function () {
                                //Give the wrapper its own closing function to prevent binding it to a certain Modality-objects abort-function
                                enableViewportScroll();

                                wrapper.className += " " + fadeHiddenClass;

                                window.setTimeout(function () {
                                    console.log("Remove modality from DOM");
                                    destroyActions();
                                    try {
                                        wrapper.parentNode.removeChild(wrapper);
                                    } catch (ignore) {}

                                }, fadeTime);
                            };
                        },
                        delay: cancelDelay
                    });
                }
            }());

            //Add the Modality-container
            modalContainer = document.createElement("div");
            modalContainer.className = "Modality-container";
            wrapper.appendChild(modalContainer);

            //Prevent clicks on the Modality-container to bubble up to the Modality-window
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


            //Add the Modality-window
            modalWindow = document.createElement("div");
            modalWindow.className = "Modality-window";
            if(self.options.className) {
                modalWindow.className += " " + self.options.className;
            }
            modalWindow.addEventListener("keydown", function (event) {
                var e = event || window.event; //get window.event if argument is falsy (in IE)

                //console.log("event", e);
                //Close the modal-window on Escape-key
                if (e.keyCode === 27) {
                    abort();
                }
            });

            modalContainer.appendChild(modalWindow);

            //Add the Modality-close element
            modalClose = document.createElement("button");
            modalClose.setAttribute("type", "button");
            modalClose.className = "Modality-close";
            modalClose.innerHTML = self.options.closeLink;

            defer({
                func: function () {
                    modalClose.onclick = cancelAction;
                },
                delay: cancelDelay
            });

            modalWindow.appendChild(modalClose);

            // Add the Modality-content
            modalContent = document.createElement('div');
            modalContent.className = "Modality-content";
            modalWindow.appendChild(modalContent);

        }());

        (function setContent() {
            if (self.options.content) {
              modalContent.innerHTML = self.options.content;
            } else {
              modalContent.innerHTML = "";
            }
        }());

        //Add buttons to the Modality-window
        if (self.options.buttons) {
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

        (function resizeAndPosition() {
            //Do an initial resize to size and position the content nicely
            resize();

            //Make sure that changes to the viewport size resizes the content
            window.addEventListener("resize", function () {
                resize();
            });

            //Make sure that the Modality-wndow is repositioned when scrolling (for iOS)
            window.addEventListener("scroll", function () {
                position();
            });
        }());

        //The modal is loaded and in position, so fire the onReady function
        if (self.options.onReady) {
            defer({
                func: function () {
                    console.group("Modality: onReady");
                    self.options.onReady({
                        element: modalWindow,
                        update: function (html) { update(html); },
                        close: destroy, //include the close-function so that it's available before the return has been executed
                        abort: abort
                    });

                    if (self.options.formFieldFocus) {
                        focus();
                    }
                    console.groupEnd();
                },
                delay: self.options.fadeTime
            });

        }

        (function autoClose() {
            //If the popupWindow is set to auto-close
            if (self.options.time) {
                // Wait for time to pass, and then close the popupWindow while passing on the onClose-function
                defer({
                    func: function () {
                        destroy();
                    },
                    delay: self.options.time
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
        update: function (html) {
            update(html);
        },
        element: modalWindow
    };
};