
var syncIPs = [];
var syncTimes = [];

// 发送 tick
function sendTick(tick) {
    local.send("/syncTick", tick);
}

// 发现组成员
function discoverMulticastMembers() {
    local.send("/discover");
    local.parameters.setCollapsed(true);
    local.values.getChild("multicastMembers").setCollapsed(false); // 展开 Multicast Members
    local.values.multicastMembers.members.set("");                 // 创建前先清空, 否则不更新
    // local.values.getChild("multicastMembers").getChild("members").set("");  // 创建前先清空, 否则不更新,不同的调用方式
}

// 修改本机监听端口, deamon会向新端口上报
function multicastReply(replyPort){
    local.values.alignment.setCollapsed(true);
    local.values.multicastMembers.setCollapsed(false);
    util.delayThreadMS(1000);    // 延时
    local.send("/multicast/reply", replyPort);
}

// 修改组播地址, 提取当前组播成员, 逐个单播新地址, 注意, 必须先发现一次, 拿到组成员 IP 表
// 组播地址范围 (IPv4, Class D) :
// 范围	                            用途	                            能不能用
// 224.0.0.0 ~ 224.0.0.255	    本地网络控制 (OSPF, mDNS, DHCP 等协议用)    ❌ 别用, 跟协议冲突
// 224.0.1.0 ~ 238.255.255.255	公网全局组播	                         ⚠️ 理论上可以, 但路由器可能不转发
// 233.0.0.0/8	                GLOP 组播 (AS 号映射) 	                 ❌ 公网用
// 239.0.0.0 ~ 239.255.255.255	管理作用域 (私有组播) 	                  ✅ 局域网专用, 就是干这个的
function multicastAddress(host){
    var members = local.values.multicastMembers.members.get();
    var multicastPort = local.parameters.oscOutputs.oscOutput.remotePort.get();
    // script.log(multicastPort + "\n" + members);

    if (!members) {
        local.values.getChild("multicastMembers").getChild("members").set(
            "THERE MUST BE MEMBERS TO SWITCH MULTICAST GROUP"); //必须有成员才能切换组播组
        return;
    }
    var ips = members.trim().split("\n");
    for (var i = 0; i < ips.length; i++){
        var ip = ips[i].trim();
        if (ip === "") continue;
        // script.log("IP: " + ip);
        local.sendTo(ip, multicastPort, "/multicast/host", host);    // 单播到每个成员
    }
    local.values.alignment.setCollapsed(true);
    util.delayThreadMS(1000);    // 延时
    discoverMulticastMembers(); // 重新发现
    local.values.multicastMembers.setCollapsed(false);
}

// 修改组播端口, 需要重启 multiscreen-sync, 暂不实现
// 为了防止被修改, 已在初始化阶段设置为只读
function multicastPort(port){
    local.send("/multicast/port", port);
    local.values.alignment.setCollapsed(true);
    local.values.multicastMembers.setCollapsed(false);
    // util.delayThreadMS(1000);    // 延时
}

// 组成员管理, 向成员单播: /member, join|leave
function membersManager(memberIP, args) {
    var port = local.parameters.oscOutputs.oscOutput.remotePort.get();
    var address = "/member";
    local.sendTo(memberIP, port, address, args);
    script.log(memberIP, port, address, args);

    util.delayThreadMS(100);    // 延时
    discoverMulticastMembers();
}
// 让组成员构建播放列表
function buildPlaylist() {
    local.send("/playlist/get");
}

//获取播放列表
function getPlaylist() {
    local.send("/playlist/get");
}

// 图片播放时长
function pictureDuration(duration) {
    local.send("/playlist/picture/duration", duration);
}
// 设置循环模式
function setLoop(mode){
    local.send("/playlist/mode", mode);
}

// 播放列表索引
function PlayIndex(index) {
    local.send("/playlist/index", index);
}

// 下一曲
function playNext() {
    local.send("/playlist/next");
}

 // 播放列表索引
function playPrev() {
    local.send("/playlist/prev");
}

// 添加到播放列表
function playlistAdd(fileName) {
    local.send("/playlist/add", fileName);
}

// 删除播放列表索引的条目
function playlistRemove(index) {
    local.send("/playlist/remove", index);
}
// 清空播放列表
function playlistClear() {
    local.send("/playlist/clear");
}

// 重新扫描视频目录
function playlistReload() {
    local.send("/config/reload");
}

// 查看视频目录
function playlistDirectoryCheck() {
    local.send("/config/dir");
}

// 心跳, 开启|关闭, 间隔秒
function heartbeat(enable, interval) {
    local.send("/config/heartbeat", enable, interval);
}
// 看门狗启用
function watchDog(enable) {
    local.send("/config/watchdog", enable);
}

// AlarmReceiver 保活间隔, 秒
function keepAliveAlarm(interval) {
    local.send("/config/keepalive/alarm", interval);
}

// 保活设置检查
function keepAliveCheck() {
    local.send("/config/keepalive/check");
}
// workmanager 保活间隔, 分钟
function keepAliveWorKmanager(interval) {
    local.send("/config/keepalive/workmanager", interval);
}

// /restart: 重启 kodi, /reboot: 重启系统, /shutdown: 关闭系统
function powerControl(command) {
    local.send("/power/" + command);
    // script.log("/power/" + command);
    local.values.getChild("Power Control").setCollapsed(true);

}

// 对齐播放: 值: 播放索引, 对齐时间点(ms)
function alignmentPlay(index, position) {
    alignmentReadyCount = 0;
    local.send("/alignment/prepare", index, position);
}

// 播放文件
function playFile(fileName, position) {
    local.send("/play", fileName, position);
}

// 暂停当前视频
function pause(int) {
    local.send("/pause", int);
}

// 停止, 回到主界面(此操作可能会销毁 playerId, 因此需要重新初始化才能播放, 即 buildPlaylistl)
function stopPlay() {
    local.send("/stop");
}

// 播放/暂停: 对当前正在播放的视频有效
function playPause() {
    local.send("/playpause");
}

// seek to position_ms, delay
function alignmentSeek(position){
    local.send("/seek", position);
}

// 设置音量
function setVolume(volume) {
    local.send("/volume", volume);
}

// 静音
function setMute(isMute) {
    local.send("/mute", isMute);
}

// 播放速度
function setSpeed(speed) {
    local.send("/speed", speed);
}

// 速度微调
function speedAdjust(unicastIP,speed, chasingTime) { 
    var port = local.parameters.oscOutputs.oscOutput.remotePort.get();
    local.sendTo(unicastIP, port, "/speed/adjust", speed, chasingTime);
}

// 设置上报端口
function setPort(port) {
    // local.send("/port", port);
    // util.delayThreadMS(1000);    // 延时
    local.parameters.oscInput.localPort.set(port);
    util.delayThreadMS(1000);    // 延时
    local.send("/port", port);
}

// 计划任务
// 定时播放
function scheduleStart(time) {
    local.send("/schedule/start", time);
}
// 定时停止
function scheduleStop(time) {
    local.send("/schedule/stop", time);
}
// 清除播放定时
function schedulePlayClear() {
    local.send("/schedule/clear");
    local.values.getChild("Schedule Play").getChild("Schedule Start").set("");
    local.values.getChild("Schedule Play").getChild("Schedule Stop").set("");
    local.values.getChild("Schedule Play").setCollapsed(true);
}

// 定时重启
function scheduleReboot(time) {
    local.send("/power/schedule/reboot", time);
}
// 定时关机
function scheduleShutdown(time) {
    local.send("/power/schedule/shutdown", time);
}
// 清除电源定时
function schedulePowerClear() {
    local.send("/power/schedule/clear");
    local.values.getChild("Power Control").scheduleReboot.set("");
    local.values.getChild("Power Control").scheduleShutdown.set("");
    local.values.getChild("Power Control").setCollapsed(true);
}

function speedToast(bool) { 
    local.send("/config/speedtoast", bool);
}

function help() { 
    local.send("/help");
}

// debuginfo
function debugInfo(bool) {
    local.send("/overlay", bool);
}

// 性能模式开关, surface 1=性能模式(SurfaceView), 0=调试模式(TextureView, 支持3D/屏幕共享)
function performance(bool) {
    local.send("/config/surface", bool);
}

function set3D(ip, value) {
    var port = local.parameters.oscOutputs.oscOutput.remotePort.get();
    script.logWarning(ip, port);
    local.sendTo(ip, port, "/3d", value);
}

function TCT(string, fontSize, location) {
    local.send("/tct", string, fontSize, location);
}

function startupFile(fileName) {
    local.send("/config/startup" , fileName);
}

function settings() {
    local.send("/settings");
}


var memberIPs = [];             // 存储当前成员 IP, 在发现成员时维护
// 动态添加组员容器, 已存在则补齐子参数
function updateMemberContainer() {
    var members = local.values.getChild("multicastMembers").getChild("members").get();
    if (!members) return;
    var ips = members.trim().split("\n");   // Array
    // for (var i = 0; i < ips.length; i++) { 
    //     var ip = ips[i].trim();
    //     script.logWarning("member: " + ip);
    // }

    memberIPs = ips;    // 更新到 全局变量 memberIPS
    // script.logWarning("memberIPs: " + memberIPs);
    // for (var j = 0; j < memberIPs.length; j++){
    //     var memberIP = memberIPs[j];
    //     script.logWarning("===========memberIP: " + memberIP);
    // }

    // 遍历现有容器, 按 niceName 索引
    var existingByNiceName = {};    // 用来存友好名字
    var existingByName = {};        // 用来存脚本名字
    var containers = local.values.getContainers();  // 获取所有容器
    for (var i = 0; i < containers.length; i++) {
        var c = containers[i];      // 每个容器
        if (c.niceName && c.niceName.indexOf(".") >= 0) {   // 如果容器存在且友好名字中包含 .
            existingByNiceName[c.niceName] = c;
            existingByName[c.name] = c;
        }
    }

    for (var j = 0; j < ips.length; j++) {
        var ip = ips[j].trim();
        if (ip === "") continue;

        var memberContainer = existingByNiceName[ip];
        if (!memberContainer) {
            memberContainer = local.values.addContainer(ip);
            if (!memberContainer) continue;
            script.log("Created container for " + ip);
        }

        memberContainer.setCollapsed(true);

        // 补全缺失的参数
        var curParams = memberContainer.getControllables(true, false);
        var hasStatus = false, hasFile = false; hasbenchmark = false; has3D = false;
        for (var p = 0; p < curParams.length; p++) {
            if (curParams[p].name === "Status") hasStatus = true;
            if (curParams[p].name === "File") hasFile = true;
            if (curParams[p].name === "Adjust") hasAdjust = true;
            // if (curParams[p].name === "ChasingTime") hasChasingTime = true;
        }
        if (!hasStatus) {
            var statusParam = memberContainer.addStringParameter("Status", "当前状态", "-----------------");
            statusParam.setAttribute("readOnly", true);
        }
        if (!hasFile) {
            var fileParam = memberContainer.addStringParameter("File", "当前播放的文件路径", "-----------------");
            fileParam.setAttribute("readOnly", true);
        }
        if (!hasbenchmark) {
            var benchmarkParam = memberContainer.addBoolParameter("I am benchmark", "如果希望:\n接音响的设备永不被调速,\n选我做同步基准,\n其它设备跟着我跑!\n===========================", false);
        }
        if (!has3D) {
            // addEnumParameter(name, description, label1, value1, label2, value2, ...)
            var has3DParam = memberContainer.addEnumParameter("3D", "被动立体模式\n---: 查询\nOff: 此选项关闭被动立体, \n主动立体或已在外部预切割, 选此项\nSide by Side of Left: 左右格式的左侧\nSide by Side of Right: 左右格式的右侧\nTop and Bottom of Top: 上下格式的上部\nTop and Bottom of Bottom: 上下格式的下部\n=============================================", 
                "---", "",
                "Off", "off",
                "Side by Side of Left", "left",
                "Side by Side of Right", "right",
                "Top and Bottom of Top", "ou_top",
                "Top and Bottom of Bottom", "ou_bottom"
            );
        }
        // if (!hasChasingTime) {
        //     var chasingTimeParam = memberContainer.addIntParameter("ChasingTime", "追齐时间", 3, 1, 5);
        // }

        // 补全缺失的子容器
        var curSubs = memberContainer.getContainers();
        var hasPlaylist = false;
        for (var s = 0; s < curSubs.length; s++) {
            if (curSubs[s].name === "Playlist") hasPlaylist = true;
        }
        if (!hasPlaylist) {
            var pl = memberContainer.addContainer("Playlist");
            var plParam = pl.addStringParameter("Playlist", "Playlist", "-----------------");
            plParam.setAttribute("multiline", true);
            plParam.setAttribute("readOnly", true);
        }
    }
}

// 删除活跃列表中不存在的成员容器
function cleanupMemberContainers() {
    // util.delayThreadMS(200);
    var membersStr = local.values.getChild("multicastMembers").getChild("members").get();
    if (!membersStr) return;
    var activeIPs = membersStr.trim().split("\n");
    var containers = local.values.getContainers();
    var staleNames = [];

    // 遍历容器, 找出不在 activeIPs 中的 IP 容器
    for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        var memberName = container.niceName;
        if (!memberName || memberName.indexOf(".") < 0) continue;

        var found = false;
        for (var j = 0; j < activeIPs.length; j++) {
            if (activeIPs[j].trim() === memberName) {
                found = true;
                break;
            }
        }
        if (found) continue;

        staleNames.push(memberName);
    }

    // 先收集再删除: 删光子项, 再删父容器
    for (var i = 0; i < staleNames.length; i++) {
        script.log("Member is Leave: " + staleNames[i]);
        var staleKey = staleNames[i].split(".").join("");

        // 遍历 containers 找到匹配的容器对象 (避免 getChild)
        var memberContainer = null;
        for (var k = 0; k < containers.length; k++) {
            if (containers[k].name === staleKey) {
                memberContainer = containers[k];
                break;
            }
        }
        if (!memberContainer) continue;

        // 1. 删所有参数
        var params = memberContainer.getControllables(true, false);
        for (var p = 0; p < params.length; p++) {
            memberContainer.removeParameter(params[p].name);
        }

        // 2. 删所有子容器 (先删子容器的参数)
        var subCons = memberContainer.getContainers();
        for (var s = 0; s < subCons.length; s++) {
            var subParams = subCons[s].getControllables(true, false);
            for (var sp = 0; sp < subParams.length; sp++) {
                subCons[s].removeParameter(subParams[sp].name);
            }
            memberContainer.removeContainer(subCons[s].name);
        }

        // 3. 删父容器 (用 .name 无点)
        local.values.removeContainer(staleKey);
    }
}

var syncData = {};              // 存储每个 IP 的最新数据
var syncIps = [];               // 与 syncData 同步维护的 IP 列表
var syncGlobalCool = 0;
var syncMasterIp = "";          // 固定基准盒子, 永不调速
var syncCount = {};             // { originIp: overCount } 独立计数, 不被 syncData 覆盖
var alignmentReadyCount = 0;    // /Alignment/ready 已上报数, 满则自动播放

function syncDrift(originIp, current_ms, fps) {
    var now = util.getTime();

    if (!syncData[originIp]) syncIps.push(originIp);

    if (originIP.length <= 1) reurn;

    // 首个设备固定为基准
    if (syncMasterIp === "") {
        syncMasterIp = originIp;
        syncCount[originIp] = 0;
    }

    // 检查容器中是否有 "I am benchmark" 开关被勾选
    var key = originIp.split(".").join("");
    var container = local.values.getChild(key);
    if (container) {
        var bp = container.getChild("I am benchmark");
        if (bp && bp.get() == 1) syncMasterIp = originIp;
    }

    var setSpd = syncData[originIp] ? (syncData[originIp].setSpeed || 1.0) : 1.0;
    syncData[originIp] = {
        current_ms: current_ms,
        fps: fps,
        lastUpdate: now,
        setSpeed: setSpd
    };

    // 基准永不调速
    if (originIp === syncMasterIp) return;

    // 基准数据必须在 2s 内
    var master = syncData[syncMasterIp];
    if (!master || now - master.lastUpdate > 4) return;

    // 投影基准到当前时刻
    var masterEst = master.current_ms + (now - master.lastUpdate) * 1000 * (master.setSpeed || 1.0);
    // 当前盒子数据新鲜, 直接用原始位置
    var myPos = current_ms;

    var frameMs = 1000 / parseFloat(fps);
    var delta = Math.round(myPos - masterEst);

    if (delta < 33 && delta > -33) {
        syncCount[originIp] = 0;
        return;
    }

    if (!syncCount[originIp]) syncCount[originIp] = 0;
    var prev = syncCount[originIp];
    if (delta > 0) {
        syncCount[originIp] = prev >= 0 ? prev + 1 : 1;
    } else {
        syncCount[originIp] = prev <= 0 ? prev - 1 : -1;
    }
    if (syncCount[originIp] < 2 && syncCount[originIp] > -2) return;

    var adjust = 1 - delta / 10000;
    if (Math.abs(adjust - 1) > 0.02) adjust = adjust > 1 ? 1.02 : 0.98;

    var port = local.parameters.oscOutputs.oscOutput.remotePort.get();
    local.sendTo(originIp, port, "/speed/adjust", adjust, 0);
    syncData[originIp].setSpeed = adjust;
    syncGlobalCool = now + 5;
    script.logWarning("[SYNC] >>> adjust " + originIp + " d=" + delta + "ms ref@" + Math.round(masterEst) + " me@" + myPos + " speed=" + Math.round(adjust * 1000000) / 1000000);
}

// =============================================================================
//
function oscEvent(address, args, originIp) {
    // script.log(originIp + " -> " + address + " " + args[0] + " " + args[1]);
    // /daemon/discover : 10.0.0.88 20:00:01:06:53:1c 20.5.0
    // /daemon/discover : 10.0.0.39 02:00:00:33:15:01 20.5.0
    // /daemon/discover : 10.0.0.69 02:00:00:2b:0e:01 20.5.0
    if (address === "/Discover"){ // 发现组成员
        script.log("discover from: " + originIp);
        var membersContainer = local.values.getChild("multicastMembers").getChild("members");
        var rawContent = membersContainer.get();
        var ipList = rawContent ? rawContent.trim().split("\n") : [];

        // 检查 originIp 是否已在列表中
        var alreadyExists = false;
        for (var memberIndex = 0; memberIndex < ipList.length; memberIndex++) {
            if (ipList[memberIndex].trim() === originIp) {
                alreadyExists = true;
                break;
            }
        }

        // 没有重复则追加
        if (!alreadyExists) {
            ipList.push(originIp);
            var newContent = ipList.join("\n");
            if (newContent.length > 0) newContent += "\n";
            membersContainer.set(newContent);
        }
        updateMemberContainer();
        cleanupMemberContainers();
        // 展开 Multicast Members, 不构建列表
        local.values.getChild("multicastMembers").setCollapsed(false);
    }
    if (address === "/Playlist"){
        var key = originIp.split(".").join("");
        var container = local.values.getChild(key);
        util.delayThreadMS(100);
        if (!container) return;
        var pl = container.getChild("Playlist");
        if (!pl) return;
        var raw = args[0];
        var allLines = raw.split("\n");
        var out = [];
        for (var i = 0; i < allLines.length; i++) {
            var parts = allLines[i].split(" ");
            if (parts.length < 2) continue;
            out.push(parts[0] + ": " + parts[1]);
        }
        pl.getChild("Playlist").set("");
        pl.getChild("Playlist").set(out.join("\n"));
        container.setCollapsed(false);
        pl.setCollapsed(false);
    }
    // /Alignment/ready  <playlistIndex> <file> <current_ms> <total_hms>
    if (address === "/Alignment/ready"){
        var file = args[1];
        var current_ms = args[2];
        var total_hms = args[3];
        var key = originIp.split(".").join("");
        var container = local.values.getChild(key);
        if (container) {
            container.getChild("File").set("");
            container.getChild("File").set(file);
            container.getChild("Status").set("");
            container.getChild("Status").set(total_hms + "  |  " + current_ms);
            container.setCollapsed(false);
            container.getChild("Playlist").setCollapsed(true);
        }

        // 自动播放: 所有盒子均 ready 后, 延时 500ms 再 Go, 给慢的盒子一点缓冲
        alignmentReadyCount++;
        var total = memberIPs.length > 0 ? memberIPs.length : syncIps.length;
        if (alignmentReadyCount >= total) {
            alignmentReadyCount = 0;
            util.delayThreadMS(500);
            local.send("/alignment/go");
        }
    }
    // /Heartbeat : 1 0 periodic 2K_29.97-Chimei-inn-RoastDuck.mp4 119779 03:41.956 29.96999
    // isPaused, isStopped 指示灯状态, 事件, 当前文件,自发上报而来
    if (address === "/Heartbeat"){
        // /Heartbeat : 0 0 onPositionDiscontinuity(SEEK) 4K_29.97-Chimei-inn-RoastDuck.mp4 11020 03:41.955 29.97
        var port = local.parameters.oscOutputs.oscOutput.remotePort.get();  // 获取当前端口, 组播/单播统一
        var key = originIp.split(".").join(""); // 去掉 IP 中的 . 因为 chataigne 脚本访问地址没有 .
        var container = local.values.getChild(key); // 在 Values 中找到与 IP 相同的容器
        if (!container) return;
        var isPause = local.values.alignment.getChild("isPaused");
        var isStop = local.values.alignment.getChild("isStopped");
        isPause.set(args[0]);
        isStop.set(args[1]);
        var file = args[3];
        var current_ms = args[4];
        var total_hms = args[5];
        var fps = args[6];
        
        if (container){
            container.getChild("File").set("");
            container.getChild("File").set(file);
            container.getChild("Status").set("");
            container.getChild("Status").set(current_ms + "  |  " + fps + "  |  " + total_hms);
        }
        
        // 同步收敛
        if (args[0] == 0 && args[1] == 0 && current_ms > 0) {
            syncDrift(originIp, current_ms, fps);
        }
    }
    if (address === "/Config"){
         local.values.multicastMembers.message.set(args[0]);
    }

    // /kodi/error : -1 ERROR: NO ACTIVE PLAYER!!!
    if (address === "/kodi/error"){
        var key = originIp.split(".").join(""); // 去掉 IP 中的 . 因为 chataigne 内部命名没有 .
        var container = local.values.getChild(key); // 在 Values 中找到与 IP 相同的容器
        if (container){
            // container.getChild("File").set("");
            // container.getChild("File").set(file);
            container.getChild("Status").set("");
            container.getChild("Status").set(args[1]);
        }
    }
    if (address === "/Member"){
        local.values.multicastMembers.message.set(args[0]);
    }
    if (address === "/Help"){
        local.values.multicastMembers.message.set(args[0]);
        local.values.multicastMembers.setCollapsed(false);
    }
    // /system/power : 0 KODI RESTARTING......
    if (address === "/system/power") {
        var key = originIp.split(".").join(""); // 去掉 IP 中的 . 因为 chataigne 内部命名没有 .
        var container = local.values.getChild(key); // 在 Values 中找到与 IP 相同的容器
        if (container){
            container.getChild("File").set("");
            container.getChild("Playlist").getChild("Playlist").set(args[1]);
            container.getChild("Status").set("");
            // container.getChild("Status").set(args[1]);
        }
    }
}
function moduleParameterChanged(param) {
    // 是参数
    if (param.isParameter()){
        script.log("P->: " + param.name + " " + param.get());
        // script.logWarning(local.parameters.getControllables(true, false)); // 看看有哪些参数
        // script.logWarning(local.parameters.getContainers());   // 看看有哪些容器
        // script.logWarning(local.parameters.getChild("OSC Outputs").getItems()); // 看看管理器中有什么
        //
        // if (param.name == "tickFrequency") {    // 频率改变
        //     root.modules.tickForSync.parameters.frequency.set(param.get());
        //     local.scripts.sync.updateRate.set(param.get());
        // }
        if (param.name === "localPort"){setPort(param.get());}   // 修改了本机监听端口
        if (param.name === "remoteHost"){multicastAddress(param.get());}   // 修改了组播地址
        if (param.name === "remotePort"){multicastPort(param.get());}   // 修改了组播端口
    }
    // 是触发器
    else {
        script.log("P->: " + param.name);
    }
}
function moduleValueChanged(value) {
    // 是参数
    if (value.isParameter()){
        // script.log("V->: " + value.name + " : " + value.get());
        if (value.name === "alignmentTime" || value.name === "index") {
            var index = local.values.alignment.getChild("Index").get();
            var position = local.values.alignment.getChild("alignmentTime").get();
            // var futureTime = local.values.alignment.getChild("Chasing Time").get();
            alignmentPlay(index, position);
        }
        if (value.name === "seek") {alignmentSeek(value.get());}
        if (value.name === "manager") {
            var memberIP = local.values.getChild("multicastMembers").getChild("memberIP").get();
            var action = value.get();
            membersManager(memberIP, action);
            // 成员加入自动构建播放列表, 离开不构建
            if (action === "join") {
                local.values.getChild("multicastMembers").setCollapsed(true);
                local.values.getChild("powerControl").setCollapsed(true);
                local.values.getChild("Schedule Play").setCollapsed(true);
                local.values.getChild("alignment").setCollapsed(false);
                buildPlaylist();
            }
        }
        if (value.name === "alignmentDelay") {
            var index = local.values.alignment.getChild("Index").get();
            var position = local.values.alignment.getChild("alignmentTime").get();
            alignmentPlay(index, position, value.get());
        }
        if (value.name === "message") {local.parameters.setCollapsed(true);}
        if (value.name === "loop") {setLoop(value.get());}
        if (value.name === "volume"){setVolume(value.get());}
        if (value.name === "isMute"){setMute(value.get());}
        if (value.name === "scheduleStart"){scheduleStart(value.get());}
        if (value.name === "scheduleStop"){scheduleStop(value.get());}
        if (value.name === "scheduleReboot"){scheduleStart(value.get());}
        if (value.name === "scheduleShutdown"){scheduleStop(value.get());}
        if (value.name === "3d"){
            var ip = value.getParent().niceName;
            set3D(ip, value.get());
        }
        if (value.name === "performance"){performance(value.get());}

    }
    // 是触发器
    else{
        script.log("V->: " + value.name);
        if (value.name === "discover") {
            discoverMulticastMembers();
            // root.modules.kodiSync.parameters.oscOutputs.oscOutput.remotePort.set(param.get());
        }
        if (value.name === "getPlaylist") {   // 播放列表构建
            getPlaylist();
            local.values.getChild("multicastMembers").setCollapsed(true); // 折叠 Multicast Members
            local.values.getChild("powerControl").setCollapsed(true);
            local.values.getChild("Schedule Play").setCollapsed(true);
            local.values.getChild("alignment").setCollapsed(false);
        }
        if (value.name === "alignmentPlay") {  // 对齐准备
            var index = local.values.alignment.getChild("Index").get();
            var position = local.values.alignment.getChild("alignmentTime").get();
            // var futureTime = local.values.alignment.getChild("Alignment Delay").get();
            alignmentPlay(index, position);
            local.values.multicastMembers.setCollapsed(true);
            local.values.powerControl.setCollapsed(true);
            local.parameters.setCollapsed(true);
        }

        if (value.name === "play") {    // 恢复播放
            play();
            local.values.multicastMembers.setCollapsed(true);
            local.values.powerControl.setCollapsed(true);
            local.parameters.setCollapsed(true);
        }
        if (value.name === "pause") {   // 暂停
            pause();
            local.values.multicastMembers.setCollapsed(true);
            local.values.powerControl.setCollapsed(true);
            local.parameters.setCollapsed(true);
        }
        if (value.name === "stop") {    // 停止
            stopPlay();
            local.values.multicastMembers.setCollapsed(true);
            local.values.powerControl.setCollapsed(true);
            local.parameters.setCollapsed(true);
        }
        if (value.name === "playPause") {   // 播放/暂停
            playPause();
            local.values.multicastMembers.setCollapsed(true);
            local.values.powerControl.setCollapsed(true);
            local.parameters.setCollapsed(true);
        }
        if (value.name === "displayON") {powerControl("on");}
        if (value.name === "displayOFF") {powerControl("off");}
        if (value.name === "playerRestart") {powerControl("restart");}
        if (value.name === "playerExit") {powerControl("exit");}
        if (value.name === "systemReboot") {powerControl("reboot");}
        if (value.name === "systemShutdown") {powerControl("shutdown");}
        if (value.name === "schedulePlayClear") {schedulePlayClear();}
        if (value.name === "schedulePowerClear") {schedulePowerClear();}
        if (value.name === "playFile") {
            var file = local.values.getChild("Alignment").getChild("File Name").get();
            var position = local.values.alignment.getChild("alignmentTime").get();
            playFile(file, position);
        }
    }
}

// function update(deltaTime) {
//     // script.log("Delta time : " + deltaTime);
//     sendTick(deltaTime);
//     // sendTick(local.scripts.sync.params.tickTarget.get());
//     // root.modules.kodiSync.scripts.sync.params.tickTarget
// }
function init(){
    // local.logIncoming.set(true);
    // local.logOutgoing.set(true);
    // local.scripts.oSCPlayerForAndroid.enableLog.set(true);

    local.parameters.oscOutputs.oscOutput.remotePort.setAttribute("readOnly", true);
    local.parameters.oscOutputs.oscOutput.remotePort.setAttribute("description", "远程主机的组播/单播监听端口\n必须重启生效, 暂未开放\n===============================");
    local.parameters.oscOutputs.oscOutput.remoteHost.setAttribute("description", "组播地址, 要切组, 必须先有组成员\n使用 Discover 发现一次即可\n===============================");

    local.parameters.oscInput.localPort.setAttribute("description", "本机监听端口, 也就是组播组成员的上报端口\n修改会即时生效\n===============================");
    local.scripts.syncDroid.setCollapsed(true);          // 折叠 Scripts.OSCPlayerForAndroid
    local.scripts.setCollapsed(true);   
    // local.parameters.getChild("Pass-through").setCollapsed(true);   // 折叠 Pass-Through
    local.parameters.removeContainer("Pass-through"); // 删除 Pass-Through
    local.parameters.getChild("OSC Outputs").setCollapsed(true);    // 折叠 OSC Outputs
    // local.parameters.removeContainer("OSC Outputs"); // 删除 OSC Outputs
    local.parameters.getChild("OSC Input").setCollapsed(true);
    local.values.getChild("multicastMembers").setCollapsed(true); // 折叠 Multicast Members

    script.setUpdateRate(50);

    // var tickTarget = script.addTargetParameter("Tick Target" , "滴答源: Tick for Sync");
    // tickTarget.setAttribute("readOnly", true);


    script.log("====== ok =======");
    // util.showMessageBox("1", "message 1", "info", "buttonText");
    // script.delay(2000);
    // util.showMessageBox("2", "question 2", "", "buttonText");

    // script.logWarning("System uptime: " + util.getTime());          // 系统运行时间
    // script.logWarning("Unix timestamp: " + util.getTimestamp());

    util.delayThreadMS(500);
    discoverMulticastMembers();


}

// function scriptParameterChanged(param) {
//     script.log("Script Parameter Changed: " + param.name);
//     if (param.name === "tickTarget") {
//         var target = param.get();
//         script.log("Target: " + target);
//         if (target === 1) {
//             local.send("/Synctick", param.get());
//         }
//     }
// }
