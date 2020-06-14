// https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects
function testTwoObjects(object1, object2){
    return Object.keys(object1).every((key) =>  object1[key] === object2[key]);
}
