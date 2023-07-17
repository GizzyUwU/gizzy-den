module.exports = async () => {
  try {
    let dbPost = require('../assets/models/upload.js')
    let getPost = await dbPost.find()
    let html = getPost.map((project) => {
      const truncatedDesc = project.projectDesc.length > 38
        ? project.projectDesc.substring(0, 38) + '...' // Truncate to 20 characters and add ellipsis
        : project.projectDesc; // Keep the original description if it's already shorter

      return [
        `<article style="flex-basis: 48%;">`,
        `<div class="article-wrapper">`,
        `<div class="article-body">`,
        `<h2 style="color: rgb(255, 255, 255);">${project.projectName}</h2>`,
        `<p style="color: rgb(255, 255, 255);">${truncatedDesc}</p>`,
        `<a href="/projects?p=${project.projectId}" style="color: #6bb6c0">`,
        `Read more`,
        `<span class="sr-only"></span>`,
        `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="#6bb6c0">`,
        `<path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />`,
        `</svg>`,
        `</a>`,
        `</div>`,
        `</div>`,
        `</article>`
      ].join('');
    }).join('');
    return html;
  } catch (err) {
    console.log(err);
    return err;
  }
}
