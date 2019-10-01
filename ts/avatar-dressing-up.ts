
let config = {
    background: "background/background-1-3.png",                // (bg)
    hair: "hair/hair-7-6.png",                // hair
    skin: "skin/skin-1-1.png",                  // skin
    clothes: "clothes/clothes-1-14.png",        // (clothes)
    backhair: "",    // (backhair)
    fronthair: "fronthair/fronthair-7-1.png",     // fronthair
    eyes: "eyes/eyes-1-2.png",                // eyes
    eyebrows: "eyebrows/eyebrows-1-1.png",         // eyebrow
    mouth: "mouth/mouth-1-1.png",               // mouth
    face: "",                  // (face)
    headwear: "headwear/headwear-1-2.png",      // (headwear)
    pet: "pet/pet-1-7.png",                     // (pet)
    hand: "hand/hand-1-3.png",                // (hand)
};


function loadAssetImage(cv, src, callback) {
    if(src === undefined || src.length <= 0) {
        callback();
        return;
    }
    let image = document.createElement('img');
    image.src = `./image/avatar/${src}`;
    image.addEventListener("load", function() {
        cv.context.drawImage(image, 0, 0);
        callback();
    });
}

function Change(item, code, config, cv) {
    console.log(item);
    console.log(code);
    config[item] = `${item}/${code}.png`;
    console.log(config);
    Render(cv, config);
}

function Render(cv, config) {
    loadAssetImage(cv, config.background, ()=>{
    loadAssetImage(cv, config.hair, ()=>{
    loadAssetImage(cv, config.skin, ()=>{
    loadAssetImage(cv, config.clothes, ()=>{
    loadAssetImage(cv, config.backhair, ()=>{
    loadAssetImage(cv, config.fronthair, ()=>{
    loadAssetImage(cv, config.eyes, ()=>{
    loadAssetImage(cv, config.eyebrows, ()=>{
    loadAssetImage(cv, config.mouth, ()=>{
    loadAssetImage(cv, config.face, ()=>{
    loadAssetImage(cv, config.headwear, ()=>{
    loadAssetImage(cv, config.pet, ()=>{
    loadAssetImage(cv, config.hand, ()=>{
    });});});});});});});});});});});});});
}