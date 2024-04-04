# MarkdownEditor.js
JavaScript Markdown editor

I developped this JavaScript Markdown editor some time ago, I share in case it could be helpful to someone, feel free to copy, reuse and modify.

This editor is only a web interface, I use it in conjunction with Markdig on .NET web applications.

Here, you'll find an example of how to use it:

First, you'll need a textarea control in your page, I use Razor to generate one for me (I use Bootstrap layout in the following example).

    <div class="row">
        <div class="col-lg-6">
            @Html.TextAreaFor(m => m.Content, new { @class = "form-control mb-3", @id = "markdownContent", placeholder = Html.GetCultureResourceString("/KnowledgeBase/Edit", "ContentPlaceholder") })
        </div>
        <div class="col-lg-6">
            <div id="markdownPreview" class="mb-3"></div>
        </div>
    </div>

But a classic textarea will do the trick as well.

    <div class="row">
        <div class="col-lg-6">            
            <textarea id="markdownContent" class="form-control mb-3" placeholder="Html.GetCultureResourceString("/KnowledgeBase/Edit", "ContentPlaceholder")"></textarea>
        </div>
        <div class="col-lg-6">
            <div id="markdownPreview" class="mb-3"></div>
        </div>
    </div>

Then, you'll need to instanciate the editor using JavaScript.

    var markdownEditor = $("#markdownContent").MarkdownEditor({
        url: "/Markdown/ConvertToHtml",
        imageUploadUrl: "/Attachment/UploadMarkdownEditorImage",
        imageDownloadUrl: "/Attachment/Download?key=",
        markdownPreview: $("#markdownPreview"),
        cheatSheetUrl: "https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet"
    });

As I said before, I use Markdig server side to process the input text into something presentable. You should fill the url parameter to point to the server action in charge of processing your text, here is my code.

    [HttpPost]
    [ValidateInput(false)]
    public JsonResult ConvertToHtml(string markdownContent)
    {
        return Json(Markdown.ToHtml(markdownContent, new MarkdownPipelineBuilder().UseBootstrap().UseEmojiAndSmiley().UseAutoLinks().Build()));
    }

You can insert images in your text using the editor, for this you'll need to have these images accessible from an URL. To perform this, I configure the imageUploadUrl, this URL will be used to upload the attachments to the server, insert it in my DB, and then return a key that will be appended to the imageDownloadUrl parameter to access the image.

In the markdownPreview parameter, you can configure which DOM element will contain the preview content returned from the server.

The cheatSheetUrl is a link to a guide for using Markdown markup.

There are other parameters that are set by default, if not overridden:

The first one represents the toolbar layout, names are functionality buttons, and | are splitters.
    
    toolbarConfiguration: ["bold", "italic", "|", "code", "quote", "link", "image", "|", "title", "subtitle", "ordered list", "unordered list"]

As I use FontAwesome for the buttons' icons, you can configure the icon style (old style as far, fal, fas... or new style as fa-regular, fa-light, fa-solid...)

    fontAwesomeIconType: "fal"

You can also configure the accepted file extensions for the images you upload to your server, default are JPG and PNG only.

    acceptedImageExtensions: ".jpg,.png"

Here we go, implementation is as simple as that.
