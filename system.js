//    COPYRIGHT»                         QPlug.cz 2017
//    DEVELOPERS»                        Hellbyte
//    ROOM»                              https://plug.dj/plugdj-czsk
//    PRIKAZY»                           Doplníme..

API.chatLog("[ QBot ] Systém je spustený!");
var prefix = "!";
var prefixinfo = "?";

//                          FUNKCIE                          //

API.setVolume(0);
API.sendChat("/cap 1");

var emoji = $(".icon-emoji-on");
if(emoji.length > 0){
emoji[0].click();
}

var sounds = $(".icon-chat-sound-on");
if(sounds.lenght > 0){
sounds[0].click();  
}

var onlyaudio = $(".item.s-vo");
if(onlyaudio.length > 0){
onlyaudio[0].click();
}

var avatarsoff = $(".item.s-dancing.selected");
if(avatarsoff.length > 0){
avatarsoff[0].click();
}

var videooff = $(".item.s-av.selected");
if(videooff.length > 0){
videooff[0].click();
}

API.on(API.USER_JOIN, function staff(user) {
var from = user.username;
var fromid = user.id;

if (fromid === 4635487){
API.sendChat("Zamestnanec "+ from +" sa práve pripojil do komunity! :blue_heart:");
}
});

API.on(API.USER_JOIN, function vip(user) {
var from = user.username;
var fromid = user.id;

if (fromid === 5154101){
API.sendChat("VIP člen "+ from +" sa práve pripojil do komunity! :blue_heart:");
}
});

/*var msgs=[
"[ MINIHRA | @djs ] Vylúšti slovo ' dpglju '!"
];
var time=1200; // SEKUNDY
var timer;
API.on(API.CHAT_COMMAND, command);
API.sendChat("/startmsg");
 
function command(value){
console.log("command called");
var commandfunction = "";

if (value.indexOf(" ") == -1){
var commandfunction = value.substring(value.indexOf("/")+1,value.length);
}

else{
var commandfunction = value.substring(value.indexOf("/")+1,value.indexOf(" "));
}

var commandcontent =  value.substring(value.indexOf(" ")+1,value.length);

console.log("commandfunction: " + commandfunction);
console.log("commandcontent: " + commandcontent);

switch(commandfunction){

case "startmsg":
console.log("startmsg called");
refreshtimer();
API.chatLog("Správy sa teraz odosielajú!",true);
break;
}
}
 
function postmsg(){
var random = Math.floor((Math.random() * msgs.length));
API.sendChat(msgs[random]);
}
 
function refreshtimer(){
stoptimer(timer);
timer = window.setInterval(postmsg, time*1000);
}

function stoptimer(){
window.clearInterval(timer);
timer = null;
}*/

//                          AUTOWOOT                          //

$('#woot').click();
API.on(API.ADVANCE, advance);
function advance(obj){
$('#woot').click();
}

//                          VEDENIE                          //

API.on(API.CHAT, slovicka);
function slovicka(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;
var falseying = "4635487";

if(msg === ""+ prefix +"minihra"){
if(fromid == falseying){
API.sendChat("[ MINIHRA | @djs ] Vylúšti slovo: ' dpglju '!");
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, woot);
function woot(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;
var falseying = "4635487";

if(msg === ""+ prefix +"woot"){
if(fromid == falseying){
$('#woot').click();
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, meh);
function meh(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;
var falseying = "4635487";

if(msg === ""+ prefix +"meh"){
if(fromid == falseying){
$('#meh').click();
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, lock);
function lock(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;
var falseying = "4635487";

if(msg === ""+ prefix +"lock"){
if(fromid == falseying){
API.sendChat("[@"+ from +"] Uzamkol si zoznam!");
setTimeout(function(){ API.moderateLockWaitList(true, false); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, unlock);
function unlock(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;
var falseying = "4635487";

if(msg === ""+ prefix +"unlock"){
if(fromid == falseying){
API.sendChat("[@"+ from +"] Odomkol si zoznam!");
setTimeout(function(){ API.moderateLockWaitList(false, false); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

//                          BOUNCER                          //

API.on(API.CHAT, bouncer);
function bouncer(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

var pinguin = "4006230";
var jassyk = "5154101";
var gyn = "3857912";
var nyga = "3726868";
var knedlik = "5014687";
var samikk = "3653327";
var atti = "13505684";
var wrest = "4105532";
var viktor = "4671474";
var kevin = "4106134";

if(msg === ""+ prefix +"bouncer"){
if(fromid == pinguin || fromid == jassyk || fromid == gyn || fromid == nyga || fromid == knedlik || fromid == samikk ||  fromid == atti || fromid == wrest || fromid == viktor || fromid == kevin){
API.sendChat("[@"+ from +"] Použil si Promote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 2); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, unbouncer);
function unbouncer(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

var pinguin = "4006230";
var jassyk = "5154101";
var gyn = "3857912";
var nyga = "3726868";
var knedlik = "5014687";
var samikk = "3653327";
var atti = "13505684";
var wrest = "4105532";
var viktor = "4671474";
var kevin = "4106134";

if(msg === ""+ prefix +"unbouncer"){
if(fromid == pinguin || fromid == jassyk || fromid == gyn || fromid == nyga || fromid == knedlik || fromid == samikk ||  fromid == atti || fromid == wrest || fromid == viktor || fromid == kevin){
API.sendChat("[@"+ from +"] Použil si Demote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 0); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

//                          RESIDENT DJ                          //

API.on(API.CHAT, rdj);
function rdj(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

var kebab = "5877483";
var many = "";
var lolly = "3845624";
var sies = "5069104";
var husmania = "3737749";

if(msg === ""+ prefix +"rdj"){
if(fromid == kebab || fromid == many || fromid == lolly || fromid == sies || fromid == husmania){
API.sendChat("[@"+ from +"] Použil si Promote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 1); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

API.on(API.CHAT, unrdj);
function unrdj(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

var kebab = "5877483";
var many = "";
var lolly = "3845624";
var sies = "5069104";
var husmania = "3737749";

if(msg === ""+ prefix +"unrdj"){
if(fromid == kebab || fromid == many || fromid == lolly || fromid == sies || fromid == husmania){
API.sendChat("[@"+ from +"] Použil si Demote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 0); }, 500);
}
else{
API.sendChat("[@"+ from +"] Nemáš na to práva!");
}
}
}

//                          UZIVATELIA                          //

API.on(API.CHAT, web);
function web(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"web" || msg === ""+ prefix +"stránka" || msg === ""+ prefix +"stranka" || msg === ""+ prefix +"page" || msg === ""+ prefix +"site"){
API.sendChat("[ WEB ] Viac informácii o našej komunite!");
}
}

API.on(API.CHAT, pravidla);
function pravidla(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"pravidlá" || msg === ""+ prefix +"pravidla" || msg === ""+ prefix +"rules"){
API.sendChat("[ PRAVIDLÁ ] Pravidlá našej komunita najdeš na!");
}
}

API.on(API.CHAT, facebook);
function facebook(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"facebook" || msg === ""+ prefix +"fb"){
API.sendChat("[ FACEBOOK ] Hoď like na našu Facebook stránku https://bit.ly/QPlugcz!");
}
}

API.on(API.CHAT, autowoot);
function autowoot(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"autowoot" || msg === ""+ prefix +"aw" || msg === ""+ prefix +"rcs"){
API.sendChat("[ AUTOWOOT ] Ak chcete vidieť naše pozadie komunity použite https://rcs.radiant.dj/install!");
}
}

API.on(API.CHAT, prikazy);
function prikazy(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;

if(msg === ""+ prefix +"prikazy" || msg === ""+ prefix +"commands"){
API.sendChat("[ PRÍKAZY ] Príkazy našeho Systému najdeš na!");
}
}

API.on(API.CHAT, nabor);
function nabor(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;

if(msg === ""+ prefix +"nabor" || msg === ""+ prefix +"nábor"){
API.sendChat("[ NÁBOR ] Aktuálne prebieha Nábor do týmu, ktorý najdeš na!");
}
}

API.on(API.CHAT, pd);
function pd(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"pd" || msg === ""+ prefix +"p&d"){
API.sendChat("[ INFO ] Promote&Demote funckia je len pre náš akutálny Staff Tým. Bouncery a Resident DJi si sami môžu vymazať práva a zasa si ich vrátiť. Príkazy pre Vyhadzovačov sú !bouncer a !unbouncera a pre Residentov sú !rdj a !unrdj.");
}
}

API.on(API.CHAT, discord);
function discord(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"discord" || msg === ""+ prefix +"diskord"){
API.sendChat("[ DISCORD ] Odkaz na náš Discord je https://bit.ly/QPlugczDiscord!");
}
}

API.on(API.CHAT, event);
function event(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"event" || msg === ""+ prefix +"sútaž" || msg === ""+ prefix +"súťaž"){
API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny event. Ak chceš vedieť kedy sa bude konať Event ako prvý hoď Like na Facebook: https://bit.ly/QPlugcz & Stránka:!");
//API.sendChat("NÁZOV: - | DÁTUM: x.x.2017 od xx:xx do xx:xx | http://musicforeveryone.6f.sk/eventy");
}
}

API.on(API.CHAT, výhra);
function výhra(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"výhra" || msg === ""+ prefix +"vyhra" || msg === ""+ prefix +"odmena"){
API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny event. Ak chceš vedieť kedy sa bude konať Event ako prvý hoď Like na Facebook: https://bit.ly/QPlugcz & Stránka:!");
//API.sendChat("1. MIESTO: - | 2: - | 3: - | 4: -");
}
}

API.on(API.CHAT, afk);
function afk(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"afk" || msg === ""+ prefix +"away" || msg === ""+ prefix +"preč" || msg === ""+ prefix +"prec"){
API.sendChat("[ AFK ] Užívateľ @"+ from +" je práve preč!");
}
}

API.on(API.CHAT, back);
function back(data){
var msg = data.message;
var from = data.un;

if(msg === ""+ prefix +"back" || msg === ""+ prefix +"here" || msg === ""+ prefix +"spet"){
API.sendChat("[ AFK ] Užívateľ @"+ from +" sa práve vrátil!");
}
}

API.on(API.CHAT, joinwl);
function joinwl(data){
var msg = data.message;
var from = data.uid;

if(msg === ""+ prefix +"joinwl" || msg === ""+ prefix +"pripojit"){
API.moderateAddDJ(from);
}
}

API.on(API.CHAT, leavewl);
function leavewl(data){
var msg = data.message;
var from = data.uid;

if(msg === ""+ prefix +"leavewl" || msg === ""+ prefix +"odpojit"){
API.moderateRemoveDJ(from);
}
}

API.on(API.CHAT, id);
function id(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;

if(msg === ""+ prefix +"id"){
API.sendChat("[@"+ from +"] Tvoje ID je: "+ fromid +".");
}
}

API.on(API.CHAT, minihra1winner);
function minihra1winner(data){
var msg = data.message;
var from = data.un;
var fromid = data.uid;

if(msg === "plugdj"){
API.sendChat("[@"+ from +"] Výborne! Vylúštil si slovo 'plugdj' ako prvý. Gratulujeme! :)");
}
}
