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
Modal script

--------------------------------------------------------------------------------
Description:
Function that enable an integrated modal-window (popup) which sits in front of
the "normal" page content.

--------------------------------------------------------------------------------
Usage:
Simply place a link to the this script in the the HTML page. The script will
then automatically execute when the related constructor is subsequently envoked.

--------------------------------------------------------------------------------
Example:

<script type="text/javascript" src="modal.js"></script>

--------------------------------------------------------------------------------
Options:

--------------------------------------------------------------------------------
Dependencies:
None

--------------------------------------------------------------------------------
Revision history:
2010-06-17: Adam Barry
Entire popupwindow-structure is injected/removed, except when using a manually placed
<div class="popupWindow"></div>

2010-06-18: Adam Barry
Popupwindow-elements split up into different functions to enable the popupWindow
to be used for various purposes other than just alerts.

2011-02-08: Adam Barry
PopupWindows converted into objects with multiple options.
Custom confirm added (very small extension of standard JavaScript confirm required in order to work).

2011-02-18: Adam Barry
Compatible with Internet Explorer 6-8.
Calculated scrollbar-compensation on removal of scroll-bars.
Code refactored in accordance with JSLint

2011-02-20: Adam Barry
manualPopupWindow extended to handle multiple popupWindows.
Class-name for manual popupWindow changed from "popupWindow" to "manualPopupWindow", i.e.:
<div class="manualPopupWindow"></div>

2011-03-07: Adam Barry
resize() of popupContainer updated to handle situation where page-scroll is smaller than then client-window.

2011-03-15: Adam Barry
update() added to the popupWindow-framework

2011-03-17: Adam Barry
Elements for confirm and prompt (i.e. inputfield and buttons) moved to prototype to enable re-insertion on update()
PopupWindow receiving confirmation event correctly

2011-05-22: Adam Barry
verticalCenter added for placement of popupWindow in the center of the screen

2011-06-14: Adam Barry
Standard vertical placement for larger popup-windows fixed

2011-09-25: Adam Barry
onClose-handler working correctly after introduction of abort()-method

2011-09-28: Adam Barry
Fieldset added when type === "prompt" and check for value.length > 0 before submitting.
inputFieldClass added for classname-specification of input-field when type === "prompt"

2011-10-04: Adam Barry
inputFieldType added for support for HTML5 input-types

2011-10-13: Adam Barry
self.confirmAction proceeding directly to self.destroy() when no self.options.element.href

2011-10-22: Adam Barry
Code refactored in accordance with JSLint

2011-12-30: Adam Barry
Type === "form" added with corresponding self.focusOnFirstInputField() method

2012-01-28: Adam Barry
Addition of enableFormFunctions-method for type "prompt" and "form"

2012-02-06: Adam Barry
Form functions enabled for Microsoft .Net pseudo-forms (i.e. div.form)

2012-04-12: Adam Barry
Timeout set before activating setActiveKeyElement to prevent key-events from propagating to the popup-window.

2012-08-02: Adam Barry
focusOnFirstInputField now tests for type="hidden" when setting focus to first input-element.

2012-08-02: Adam Barry
focusOnFirstInputField tests for multiple element-types and sets focus to first form-element.

2012-08-06: Adam Barry
Clicks outside the popup-area now close the entire popup-window.

2012-08-06: Adam Barry
iScroll added for touch-enabled devices

2012-10-19: Adam Barry
Scroll-events (addScrollEvent) removed for touch-devices, as the on-screen-keyboard makes everything jump
when typing

2012-10-24: Adam Barry
Resize-events removed for touch-devices, as bringing up the on-screen-keyboard causes a screen-resize-event.

*******************************************************************************/


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
        cancelDelay = 400, //milliseconds. To prevent doubleclicks accidentally closing the modal,
        cancelCounter = false, //Counter used for showing remaining visible time for displayTime modal-windows


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
        countdown;


    //Private functions
    //-----------------------------------------
    //Default options
    self.options = {
        type: false, //false|confirm|prompt (adds functionality corresponding to the type)
        content: false, //The HTML contents of the modal-window
        className: false, //Classname for the modal-window
        displayTime: false, //Time in milliseconds, e.g. 2500, before the popup is automatically closed
        onReady: false, //A function that is executed when the modal has loaded its content, e.g. onReady: function (data) { console.log("onReady", data); }
        callback: false, //A function that is executed upon closing the modal-window, e.g. callback: function (data) { alert("callback: " + data); }
        buttons: true, //Add buttons (depending on the type-property)
        buttonCancelText: "cancel", //Text for cancel/close button
        buttonCancelClass: "btn btn--secondary",
        buttonConfirmText: "ok", //Text for ok/confirm button
        buttonConfirmClass: "btn btn--primary",
        inputFieldType: false, //For type === "confirm"
        inputFieldClass: false, //For type === "confirm"
        inputFieldPlaceholder: false, //For type === "confirm"
        inputFieldValue: false, //For type === "confirm"
        margin: 5, //Minimum distance in px between the viewport border and the modal-window. Modal-window will shrink when too little space
        disablePageScroll: true, //When set to true, body.style.overflow will be set to hidden, while modal-windows are active
        verticalCenter: false, //When set to true, the popupWindow will be centered vertically, instead of being placed towards the top of the screen
        loaderElement: false,
        showLoader: false,
        //loaderMessage: false
        closeLink: "<span>Close <span class=\"hotkey\">(esc)</span></span>" //Contents of permanent close button for the modal-window
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
                    console.log("Modal: defer()");
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

    destroyActions = function () {
        self = null;

        try {
            clearTimeout(cancelCounter);
        } catch (ignore) {}
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
        console.group("Modal: update()");

        modalContent.innerHTML = html;
        addButtons();
        resize();

        console.groupEnd();
    };


    countdown = function (obj) {
        var refreshRate = 500, //Milliseconds
            initialTime = self.options.displayTime,
            buttonText,
            updateCounter,
            timer;

        console.log("Modal: countdown()");

        if (!obj.element) { return false; }

        buttonText = obj.element.innerHTML;

        updateCounter = function () {
            obj.element.innerHTML = buttonText + " (" + Math.round(initialTime / 1000) + " sec.)";
            initialTime -= refreshRate;
        };

        timer = function () {
            updateCounter();

            cancelCounter = window.setTimeout(function () {
                timer();
            }, refreshRate);
        };

        if (self.options.displayTime === initialTime) {
            timer();
        }


    };

    addButtons = function () {
        console.group("Modal: addButtons()");

        if (!self.options.buttons) { return false; }

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
            if (self.options.inputFieldPlaceholder) {
                inputField.setAttribute("placeholder", self.options.inputFieldPlaceholder);
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
            buttonConfirm.setAttribute("type", "submit");
            if (self.options.buttonConfirmClass) {
                buttonConfirm.setAttribute("class", self.options.buttonConfirmClass);
            }
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
        if (self.options.buttonCancelClass) {
            buttonReset.setAttribute("class", self.options.buttonCancelClass);
        }
        buttonReset.innerHTML = self.options.buttonCancelText;

        defer({
            func: function () { buttonReset.onclick = cancelAction; },
            delay: cancelDelay
        });

        if (self.options.displayTime) {
            countdown({
                element: buttonReset
            });
        }

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
                            destroyActions();

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

        //Add buttons to the modal-window
        addButtons();

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
                update: function (html) { update(html); },
                close: destroy, //include the close-function so that it's available before the return has been executed
                abort: abort
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
        update: function (html) {
            update(html);
        },
        element: modalWindow
    };
};