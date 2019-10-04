var config = {
    background: "background/background-1-3.png",
    eyes: "eyes/eyes-1-2.png",
    mouth: "mouth/mouth-1-1.png",
    hair: "hair/hair-7-6.png",
    skin: "skin/skin-1-1.png",
    clothes: "clothes/clothes-1-14.png",
    backhair: "",
    fronthair: "fronthair/fronthair-7-1.png",
    eyebrows: "eyebrows/eyebrows-1-1.png",
    face: "",
    headwear: "headwear/headwear-1-2.png",
    pet: "pet/pet-1-7.png",
    hand: "hand/hand-1-3.png"
};
function loadAssetImage(cv, src, callback) {
    if (src === undefined || src.length <= 0) {
        callback();
        return;
    }
    var image = document.createElement('img');
    image.src = "./image/avatar/" + src;
    image.addEventListener("load", function () {
        cv.context.drawImage(image, 0, 0);
        callback();
    });
}
function Change(item, code, config, cv) {
    console.log(item);
    console.log(code);
    config[item] = item + "/" + code + ".png";
    console.log(config);
    Render(cv, config);
}
function Render(cv, config) {
    loadAssetImage(cv, config.background, function () {
        loadAssetImage(cv, config.hair, function () {
            loadAssetImage(cv, config.skin, function () {
                loadAssetImage(cv, config.eyes, function () {
                    loadAssetImage(cv, config.mouth, function () {
                        loadAssetImage(cv, config.clothes, function () {
                            loadAssetImage(cv, config.backhair, function () {
                                loadAssetImage(cv, config.fronthair, function () {
                                    loadAssetImage(cv, config.eyebrows, function () {
                                        loadAssetImage(cv, config.face, function () {
                                            loadAssetImage(cv, config.headwear, function () {
                                                loadAssetImage(cv, config.pet, function () {
                                                    loadAssetImage(cv, config.hand, function () {
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
