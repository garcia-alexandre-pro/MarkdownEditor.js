(function ($) {
    $.fn.MarkdownEditor = (function (options) {
        var editor = this;

        var postTimer = null;
        var postTimeout = 500;



        options = $.extend({
            //url: "/Markdown/ConvertToHtml",
            //imageUploadUrl: "/Attachment/UploadMarkdownEditorImage",
            //imageDownloadUrl: "/Attachment/Download?key=",
            //markdownPreview: $("#markdownPreview"),
            //cheatSheetUrl: "https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet",
            toolbarConfiguration: ["bold", "italic", "|", "code", "quote", "link", "image", "|", "title", "subtitle", "ordered list", "unordered list"],
            fontAwesomeIconType: "fal",
            acceptedImageExtensions: ".jpg,.png",
            requestVerificationToken: null
        }, options);



        if ($(editor).prop("tagName") !== "TEXTAREA") {
            throw "MarkdownEditor should be called on a textarea element.";

            return;
        }

        editor.addClass("markdown-editor");



        // Mapping of actions that can be bound to toolbar buttons
        var bindings = [
            { name: "bold", icon: "fa-bold", eventHandler: "toggleBlock", startBlock: '**', endBlock: '**', altStartBlock: '__', altEndBlock: '__' },
            { name: "italic", icon: "fa-italic", eventHandler: "toggleBlock", startBlock: '*', endBlock: '*', altStartBlock: '_', altEndBlock: '_' },
            { name: "code", icon: "fa-code", eventHandler: "toggleBlock", startBlock: '```', endBlock: '```', altStartBlock: '~~~', altEndBlock: '~~~' },
            { name: "quote", icon: "fa-quote-right", eventHandler: "toggleBlock", startBlock: '> ', endBlock: '\n', altStartBlock: '>', altEndBlock: '\n' },
            { name: "link", icon: "fa-link", eventHandler: "insertLink", startBlock: '[', endBlock: ']' },
            { name: "image", icon: "fa-image", eventHandler: "browseImage", startBlock: '![', endBlock: ']' },
            { name: "title", icon: "fa-h1", eventHandler: "toggleBlock", startBlock: '# ', endBlock: '\n' },
            { name: "subtitle", icon: "fa-h2", eventHandler: "toggleBlock", startBlock: '## ', endBlock: '\n' },
            { name: "ordered list", icon: "fa-list-ol", eventHandler: "toggleBlock", startBlock: '1. ', endBlock: '\n' },
            { name: "unordered list", icon: "fa-list-ul", eventHandler: "toggleBlock", startBlock: '- ', endBlock: '\n' }
        ];



        // Generating the configured toolbar
        var buttons = options.toolbarConfiguration
            .map((name) => {
                if (name === "" || name === "|" || name === "s" || name === "sep" || name === "separator") {
                    return `<i class="separator"></i>`;
                }

                var binding = bindings.find(x => x.name === name)

                return `<div class="btn btn-sm btn-secondary me-2" data-action="${binding.name}"><i class="${options.fontAwesomeIconType} ${binding.icon}"></i></div>`;
            })
            .join("");

        if (options.cheatSheetUrl) {
            buttons += `<div class="float-end"><a target="_blank" href="${options.cheatSheetUrl}" class="btn btn-sm btn-secondary"><i class="${options.fontAwesomeIconType} fa-question"></i></a></div>`;
        }

        $(editor).parent().prepend(`<div class="file"><input type="file" id="imageBrowser" class="d-none attachment-input" accept="${options.acceptedImageExtensions}"/></div>`);
        $(editor).parent().prepend(`<div class="markdown-editor-toolbar">${buttons}</div>`);



        // Previewing content
        options.markdownPreview.addClass("markdown-preview");

        $(editor).on("input", function (e) {
            clearTimeout(postTimer);

            postTimer = setTimeout(function () {
                Post(options.url,
                    {
                        __RequestVerificationToken: options.requestVerificationToken,
                        markdownContent: $(e.target).val()
                    },
                    function (htmlResult) {
                        options.markdownPreview.html(htmlResult);
                    });
            }, postTimeout);
        });

        editor.trigger("input");



        // Toolbar buttons click
        $(editor).parent().on("click", ".markdown-editor-toolbar .btn[data-action]", function (e) {
            var binding = bindings.find(x => x.name === $(e.target).data("action"));

            switch (binding.eventHandler) {
                case "insertLink":
                    insertLink(binding);
                    break;
                case "browseImage":
                    browseImage();
                    break;
                case "toggleBlock":
                    toggleBlock(binding);
                    break;
            }

            //this[binding.eventHandler](binding);
        });

        // Inserting a link (hyperlink or image)
        function insertLink(binding, link) {
            var startPoint = editor.prop("selectionStart");
            var endPoint = editor.prop("selectionEnd");

            var text = editor.val().substring(startPoint, endPoint);

            if (text == null || text.length == 0) {
                text = binding.name;
            }

            var linkStartPoint = startPoint + text.length + binding.endBlock.length + 1;

            // If the block is already active, we select the link
            if (binding.startBlock === editor.val().slice(startPoint - binding.startBlock.length, startPoint)
                && binding.endBlock === editor.val().slice(endPoint, linkStartPoint - 1)) {
                var following = editor.val().slice(linkStartPoint - 1);

                var selectionStart = startPoint - binding.startBlock.length,
                    selectionEnd = endPoint - binding.startBlock.length;

                switch (following.charAt(0)) {
                    case "[":
                        selectionStart = linkStartPoint;
                        selectionEnd = linkStartPoint + following.indexOf("]") - 1;

                        //var reference = following.slice(0, following.indexOf("]") + 1);
                        // TODO: select the referenced link
                        break;
                    case "(":
                        selectionStart = linkStartPoint;
                        selectionEnd = linkStartPoint + following.indexOf(")") - 1;
                        break;
                }

                editor.focus();

                editor.prop("selectionStart", selectionStart);
                editor.prop("selectionEnd", selectionEnd);
            }
            // We insert the starting and ending characters
            else {
                editor.val(editor.val().slice(0, startPoint)
                    + binding.startBlock
                    + text
                    + binding.endBlock
                    + `(${link == null ? binding.name : link})`
                    + editor.val().slice(endPoint));

                editor.focus();

                editor.prop("selectionStart", linkStartPoint + binding.startBlock.length);
                editor.prop("selectionEnd", linkStartPoint + editor.val().slice(linkStartPoint).indexOf(")"));
            }

            editor.trigger("input");
        }

        // Opening the file browser in order to upload a picture
        function browseImage() {
            var selectionStart = editor.prop("selectionStart");
            var selectionEnd = editor.prop("selectionEnd");

            $("#imageBrowser").click();

            editor.focus();

            editor.prop("selectionStart", selectionStart);
            editor.prop("selectionEnd", selectionEnd);
        }

        // Toggling a styling block
        function toggleBlock(binding) {
            var startPoint = editor.prop("selectionStart");
            var endPoint = editor.prop("selectionEnd");

            var text = editor.val().substring(startPoint, endPoint);

            // If the block is already active, we deactivate it by removing the starting and ending characters
            if (binding.startBlock === editor.val().slice(startPoint - binding.startBlock.length, startPoint)
                && binding.endBlock === editor.val().slice(endPoint, endPoint + binding.endBlock.length)
                || binding.altStartBlock && binding.altStartBlock === editor.val().slice(startPoint - binding.altStartBlock.length, startPoint)
                && binding.altEndBlock && binding.altEndBlock === editor.val().slice(endPoint, endPoint + binding.altEndBlock.length)) {
                editor.val(editor.val().slice(0, startPoint - binding.startBlock.length)
                    + text
                    + editor.val().slice(endPoint + binding.endBlock.length));

                editor.focus();

                editor.prop("selectionStart", startPoint - binding.startBlock.length);
                editor.prop("selectionEnd", endPoint - binding.startBlock.length);
            }
            // Else, we insert the starting and ending characters
            else {
                text = (text == null || text.length == 0 ? binding.name : text);

                editor.val(editor.val().slice(0, startPoint)
                    + binding.startBlock
                    + text
                    + binding.endBlock
                    + editor.val().slice(endPoint));

                editor.focus();

                editor.prop("selectionStart", startPoint + binding.startBlock.length);
                editor.prop("selectionEnd", startPoint + text.length + binding.startBlock.length);
            }

            editor.trigger("input");
        }

        // Uploading an image
        $(document).on("change",
            "#imageBrowser",
            function (e) {
                toaster.toast({ content: "En cours de traitement.", configurationName: "info" });

                var data = new FormData();

                data.append("file", $(e.target)[0].files[0]);

                if (options.requestVerificationToken != null) {
                    data.append("__RequestVerificationToken", options.requestVerificationToken);
                }

                $.ajax({ // upload file asynchronously through ajax
                    url: options.imageUploadUrl,
                    data: data,
                    type: 'POST',
                    processData: false,
                    contentType: false,
                    success: function (attachmentId) {
                        if (attachmentId) {
                            insertLink(bindings.find(x => x.name === "image"), `${options.imageDownloadUrl}${attachmentId}`);
                        } else {
                            toaster.toast({ content: "Une erreur est survenue lors du téléchargement.", configurationName: "warning" });
                        }
                    }
                });
            });



        editor.getFiles = () => {
            const urlRegexStr = options.imageDownloadUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const keyRegexStr = "[a-fA-F0-9]{8}-([a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}";

            return [...new Set(editor.val().match(new RegExp(urlRegexStr + keyRegexStr, 'g')).map(x => new RegExp(keyRegexStr).exec(x)[0]))];
        };



        return editor;
    });
})(jQuery);
