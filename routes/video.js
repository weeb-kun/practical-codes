const express = require("express");
const router = express.Router();
const moment = require("moment");
const Video = require("../models/Video");
const ensureLoggedIn = require("../config/ensureLogIn");
const fs = require("fs");
const upload = require("../helpers/imageUpload");

router.get("/listVideos", ensureLoggedIn, (req, res) => {
    Video.findAll({
        where: {userId: req.user.id},
        order: [["title", "ASC"]],
        raw: true
    }).then(videos => res.render("video/listVideos", {videos}))
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
    })
});

router.get("/addVideo", ensureLoggedIn, (req, res) => {
    res.render("video/addVideo");
});

router.post("/addVideo", (req, res) => {
    let title = req.body.title;
    let story = req.body.story.slice(0, 1999);
    let dateRelease = moment(req.body.dateRelease, "DD/MM/YYYY");
    let language = req.body.language.toString();
    let subtitles = req.body.subtitles == undefined ? "": req.body.subtitles.toString();
    let classification = req.body.classification;
    let userId = req.user.id;
    let poster = req.body.posterURL;
    let starring = req.body.starring;

    Video.create({
       title,
       story,
       dateRelease,
       language,
       subtitles,
       classification,
       userId,
       poster,
       starring
    }).then(video => res.redirect("/video/listVideos"))
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
    });
});

router.get("/edit/:id", ensureLoggedIn, (req, res) => {
    Video.findOne({where: {id: req.params.id}})
    .then(video => {
        if(video.userId != req.user.id) {
            req.flash("errorMsg", "You do not have access to this video.");
            res.redirect("/");
        } else {
        checkOptions(video);
        res.render("video/editVideo", {video});
        }
    })
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
    });
});

router.put("/edit/:id", (req, res) => {
    let title = req.body.title;
    let story = req.body.story.slice(0, 1999);
    let dateRelease = moment(req.body.dateRelease, "DD/MM/YYYY");
    let language = req.body.language.toString();
    let subtitles = req.body.subtitles == undefined ? "": req.body.subtitles.toString();
    let classification = req.body.classification;
    let starring = req.body.starring;
    let poster = req.body.posterURL.src;
    Video.update({
        title,
        story,
        dateRelease,
        language,
        subtitles,
        classification,
        starring,
        poster
    }, {
        where: {id: req.params.id}
    }).then(() => {
        req.flash("successMsg", "Video successfully updated.");
        res.redirect("/video/listVideos");
    })
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
    });
});

router.post("/upload", ensureLoggedIn, (req, res) => {
    if(!fs.existsSync(`./public/uploads/${req.user.id}`)) fs.mkdirSync(`./public/uploads/${req.user.id}`);
    upload(req, res, err => {
        if(err){
            res.json({file: "/img/no-image.jpg", err});
        } else {
            if(req.file === undefined){
                res.json({file: "/img/no-image.jpg", err});
            } else {
                res.json({file: `/uploads/${req.user.id}/${req.file.filename}`});
            }
        }
    });
});

function checkOptions(video){
    video.chineseLang = (video.language.search('chinese') >= 0) ? 'checked' : '';
    video.englishLang = (video.language.search('english') >= 0) ? 'checked' : '';
    video.malayLang = (video.language.search('malay') >= 0) ? 'checked' : '';
    video.tamilLang = (video.language.search('tamil') >= 0) ? 'checked' : '';
    video.chineseSub = (video.subtitles.search('chinese') >= 0) ? 'checked' : '';
    video.englishSub = (video.subtitles.search('english') >= 0) ? 'checked' : '';
    video.malaySub = (video.subtitles.search('malay') >= 0) ? 'checked' : '';
    video.tamilSub = (video.subtitles.search('tamil') >= 0) ? 'checked' : '';
}

module.exports = router;