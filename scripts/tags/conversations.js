"use strict";

const { escapeHTML } = require("hexo-util");

hexo.extend.tag.register(
  "conversations",
  function (args, content) {
    const argstr = args.join(" ");
    const avatarMatch = argstr.match(/avatar\s*[=:]\s*"([^"]+)"/);
    const dirMatch = argstr.match(/direction\s*[=:]\s*"([^"]+)"/);
    const avatar = avatarMatch ? avatarMatch[1] : "";
    const direction = dirMatch ? dirMatch[1] : "row";
    const dirClass = direction === "row-reverse" ? "row-reverse" : "row";

    const inner = hexo.render.renderSync({ text: content, engine: "markdown" });

    return (
      `<div class="conversation ${dirClass}">` +
      (avatar
        ? `<img class="conversation-avatar" src="${escapeHTML(avatar)}" alt="avatar">`
        : "") +
      `<div class="conversation-bubble">${inner}</div>` +
      `</div>`
    );
  },
  { ends: true }
);

