;(function(w, doc,undefined){

    function $(el){
        return doc.querySelector(el);
    }
    function $All(el){
        return doc.querySelectorAll(el);
    }

    function addEvent(el, event, fn){
        if(el.addEventListener){
            el.addEventListener(event, fn, false);
        }else if(el.attchEvent){
            el.attachEvent('on'+event, fn);
        }else{
            el['on'+event] = fn;
        }
    }

    function hasClass(obj, cls) {
        return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }

    function addClass(obj, cls) {
        if(!hasClass(obj, cls)) obj.className += " " + cls;
    }

    function removeClass(obj, cls) {
        if(hasClass(obj, cls)){
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            obj.className = obj.className.replace(reg, '');
        }
    }

    function toggleClass(obj,cls){
        if(hasClass(obj,cls)){
            removeClass(obj, cls);
        }else{
            addClass(obj, cls);
        }
    }
    var UUCT = {
        domain: (w.UUCHAT && w.UUCHAT.domain)|| '',
        socket: null,
        timeStart: new Date(),
        timeOutSeconds: 2700000,
        timeOutTimer: null,
        chat: {
            cid: '',
            csid: '',
            csName: ''
        },
        init: function(){
            this.loadStyle([UUCT.domain+'/static/css/customer.css']);
            if(this.isLtIe8()){
                this.loadScript(UUCT.domain+'/static/images/socket.io.js');
            }else{
                var socketIO = localStorage.getItem ? localStorage.getItem('uuchat.skcdn', socketIO) : null;
                this.loadScript(socketIO || 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.min.js');
            }
            this.createCT();
        },
        loadStyle: function(arr){

            for(var i = 0, l = arr.length; i < l; i++){
                var style = doc.createElement('link');
                style.href = arr[i];
                style.rel  = 'stylesheet';
                doc.getElementsByTagName('HEAD')[0].appendChild(style);
            }
        },
        loadScript: function(url){
            var spt = doc.createElement('script');
            spt.src = url;
            spt.async = true;
            doc.getElementsByTagName('HEAD')[0].appendChild(spt);

            spt.onload = spt.onreadystatechange = function(){
                if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete" ){
                    UUCT.ctrol();
                    spt.onload = spt.onreadystatechange = null;
                }

            };
        },
        isLtIe8: function(){
            var UA = navigator.userAgent,
                isIE = UA.indexOf('MSIE') > -1,
                v = isIE ? /\d+/.exec(UA.split(';')[1]) : 'no ie';

            return v <= 8;
        },
        cutStr: function(str, len){
            var str_length = 0,
                str_cut = new String(),
                str_len = str.length,
                a = '';

            for(var i = 0; i < str_len; i++){
                a = str.charAt(i);
                str_length++;
                if (escape(a).length > 4) {
                    str_length++;
                }
                str_cut = str_cut.concat(a);
                if (str_length >= len) {
                    return str_cut;
                }
            }
            if(str_length < len) {
                return str;
            }
        },
        createCT: function(){
            var ct = this.template(),
                ctNode = document.createElement('div');

            ctNode.setAttribute('class', 'chat-console chat-console-hidden');
            ctNode.innerHTML = ct;
            doc.body.appendChild(ctNode);
        },
        ctrol: function(){
            addEvent($('.chat-btn'), 'click', function(e){
                toggleClass($('.chat-console'), 'chat-console-hidden');
                toggleClass(this, 'chat-btn-close');

                $('.chat-nums').style.display = 'none';
                $('.chat-nums').innerHTML = 0;

                if(!UUCT.socket){
                    UUCT.createSocket();
                }
            });
        },
        ajax: function(params){
            var params = params || {}
                params.data = params.data || {},
                json = params.jsonp ? jsonp(params) : json(params);

            function json(params){
                params.type = (params.type || 'GET').toUpperCase();
                !params.fileType && (params.data = formatParams(params.data));

                var xhr = null,
                    org = window.location.protocol+'://'+window.location.host;

                xhr = new XMLHttpRequest() || new ActiveXObjcet('Microsoft.XMLHTTP');

                xhr.onreadystatechange = function() {
                    if(xhr.readyState == 4) {
                        var status = xhr.status;
                        if(status >= 200 && status < 300) {
                            var response = '';
                            var type = xhr.getResponseHeader('Content-type');
                            if(type.indexOf('xml') !== -1 && xhr.responseXML) {
                                response = xhr.responseXML;
                            } else if(type === 'application/json') {
                                response = JSON.parse(xhr.responseText);
                            } else {
                                response = xhr.responseText;
                            };

                            params.success && params.success(response);
                        } else {
                            params.error && params.error(status);
                        }
                    };
                };

                xhr.upload.onprogress = params.progress;
                params.error && (xhr.onerror = params.error);

                if(params.type == 'GET') {
                    xhr.open(params.type, params.url + '?' + params.data, true);
                    xhr.send(null);
                } else {
                    xhr.open(params.type, params.url, true);
                    xhr.send(params.data);
                }
            }

            function jsonp(params) {
                var callbackName = params.jsonp,
                    head = document.getElementsByTagName('head')[0],
                    data ,
                    script = document.createElement('script');

                params.data['callback'] = callbackName;
                data = formatParams(params.data);

                head.appendChild(script);
                window[callbackName] = function(json) {
                    head.removeChild(script);
                    clearTimeout(script.timer);
                    window[callbackName] = null;
                    params.success && params.success(json);
                };
                script.src = params.url + '?' + data;
                if(params.time) {
                    script.timer = setTimeout(function() {
                        window[callbackName] = null;
                        head.removeChild(script);
                        params.error && params.error({
                            message: 'timeout'
                        });
                    }, time);
                }
            };

            function formatParams(data) {
                var arr = [];
                for(var name in data) {
                    arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
                };
                arr.push('v=' + random());
                return arr.join('&');
            }
            function random() {
                return Math.floor(Math.random() * 10000 + 500);
            }
        },
        createSocket: function(){
            var io = window.io || io || {};

            UUCT.socket = io(UUCT.domain+'/c', {
                forceNew: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000 ,
                timeout: 10000
            });
            UUCT.socket.on('connect', this.socketConnect);
            UUCT.socket.on('connect_error', this.socketConnectError);
            UUCT.socket.on('disconnect', this.socketDisconnect);
            UUCT.socket.on('reconnect', this.socketReconnect);
            UUCT.socket.on('error', this.socketError);
            UUCT.socket.on('cs.message', this.socketCsMessage);
            UUCT.socket.on('cs.status', this.socketCsStatus);
            UUCT.socket.on('cs.disconnect', this.socketCsDisconnect);
            UUCT.socket.on('c.queue.update', this.socketQueueUpdate);
            UUCT.socket.on('c.queue.shift', this.socketQueueShift);
            UUCT.socket.on('cs.close.dialog', this.socketCloseDialog);
            UUCT.socket.on('c.dispatch', this.socketDispatch);
            UUCT.socket.on('cs.action.rate', this.socketActionRate);

            addEvent(window, 'offline', function(){
                if(UUCT.socket){
                    UUCT.socket.close();
                }
            });
            addEvent(window, 'online', function(){
                if(UUCT.socket){
                    UUCT.socket.open();
                }else{
                    UUCT.createSocket();
                }
            });
        },
        template: function(){
            var str = '<div class="chat-body">';
            str +='<div class="chat-header"><div class="chat-avatar"><img class="avatar-img" src="'+UUCT.domain+'/static/images/ua.png" /></div><div class="chat-name"></div></div>';
            str +='<div class="chat-main">';
            str +='<div class="chat-loading"><div class="bounce bounce1"></div><div class="bounce bounce2"></div><div class="bounce bounce3"></div></div>';
            str +='</div>';
            str +='</div>';
            str +='<div class="chat-btn chat-btn-open"> <div class="chat-nums" style="display: none;">0</div> </div>';
            return str;
        },
        tempOffline: function(){
            var str = '';
            str +='<div class="chat-offline">';
            str +='<p class="offline-title">Have a question about what uuChat can do for you ?</p>';
            str +='<h6>Name:</h6>';
            str +='<input type="text" placeholder="Click here and type your Name" class="offline-name"/>';
            str +='<h6>Email:</h6>';
            str +='<input type="email" placeholder="Click here and type your Email" class="offline-email" required="required" />';
            str +='<h6>Describe:</h6>';
            str +='<textarea placeholder="Let us know and someone will get back to you within 24 hours, if not sooner!(max 256 words)" class="offline-text"></textarea>';
            str +='<button class="offline-send">Send</button></div>';

            return str;
        },
        tempMsg: function(){
            var str = '';
            str += '<div class="chat-msg"></div>';
            return str;
        },
        tempSend: function(){
            var str = '',
                emj = this.tempEmoji();
            str += '<div class="chat-send">';
            str += '<div class="chat-send-text">';
            str += '<pre class="send-pre"></pre>';
            str += '<textarea placeholder="Input text and Press Enter (max 256 words)" class="chat-send-area" maxlength="256"></textarea>';
            str += '<div class="chat-send-btns">';
            str += emj;
            str += '<label class="chat-send-btn chat-emoji-btn"></label>';
            if(window.FormData){
                str += '<label class="chat-send-btn chat-file-btn" for="upload-file">';
                str += '<input id="upload-file" name="image" type="file" class="chat-upload" accept="image/png, image/jpeg, image/gif,image/jpg" /></label>';
            }
            str += '</div> </div> </div>';
            return str;
        },
        tempEmoji: function(){
            var str = '';
            str += ' <div class="emoji-lists emoji-lists-hidden">';
            for(var i = 0, l = UUCTemo.length; i < l; i++){
                str += '<span class="emoji-item" title="'+UUCTemo[i].name+'">'+UUCTemo[i].text+'</span>';
            }
            str +='</div>';
            return str;
        },
        tempMsgItem: function(role, msg, t){
            var str = '',
                cls = '',
                name = '',
                h = '',
                m = '',
                isOld = false;

            if(typeof t === 'number'){
                cls += 't-'+t+' ';
                t = UUCT.dateISOFomat(t);
            }

            if(typeof t === 'string'){
                t = UUCT.dateISOFomat(t);
                isOld = true;
            }

            h = t.getHours(),
                m = t.getMinutes();

            m = m > 9 ? m : '0'+m;

            if(0 === role){
                cls += 'chat-to';
                if(/(png|jpg|gif|jpeg)\|/g.test(msg)){
                    cls += isOld ? ' done-img' : '';
                }else{
                    cls += isOld ? ' done' : '';
                }
            }else{
                cls = 'chat-from';
                name = UUCT.chat.csName;
            }

            msg = this.msgFilter(msg);
            str += '<div class="chat-item '+cls+'">';
            str += '<p class="chat-role"><i>'+name+'</i>'+h+':'+m+'</p>';
            str += '<div class="chat-text">'+msg+'</div>';
            str += '<div class="chat-caret"></div></div>';

            return str;
        },
        msgFilter: function(msg){
            var imgReg = /[a-zA-Z0-9.%=/]{1,}[.](jpg|png|jpeg)/g,
                imgSrc = msg,
                str = '';

            if(imgReg.test(imgSrc)){
                imgSrc = msg.split('|');
                str += '<a href="'+UUCT.domain+'/'+imgSrc[1] +'" target="_blank">';
                str += '<img src="'+UUCT.domain+'/'+imgSrc[0] +'" width="'+imgSrc[2]+'" height="'+imgSrc[3]+'" alt="" /></a>';
            }else{
                str = msg.replace(/&nbsp;/g, ' ').replace(/#/gi, "<br />").replace(/((https?|ftp|file|http):\/\/[-a-zA-Z0-9+&@#\/%?=~_|!:,.;]*)/g, function(match){
                    return '<a href="'+match+'" target="_blank">'+match+'</a>';
                });
            }
            return str;
        },
        msgTranslate: function(msgObj){

            var chatMsg =  $('.chat-msg');

            if(msgObj.msg === 1){

                var str = '';

                str += '<div class="rate-box">';
                str += '<p class="rate-title">Please rate the dialogue</p>';
                str += '<div class="rete-heart">';
                str += '<span class="rate-span">1</span><span class="rate-span">2</span><span class="rate-span">3</span><span class="rate-span">4</span><span class="rate-span">5</span>';
                str +='</div>';
                str +='<div class="rete-btn">Done</div></div>';

                chatMsg.innerHTML += this.tempMsgItem(msgObj.role, str, new Date());

                var hearts = $All('.rete-heart'),
                    rateBtns = $All('.rete-btn');

                for(var i = 0, l = hearts.length; i < l; i++){
                    (function(i){
                        var rateLevel = 5,
                            rate = hearts[i].children;
                        addEvent(hearts[i], 'mouseover', function(e){
                            var e = e || w.event,
                                tg = e.target || e.srcElement;

                            if(tg.tagName.toLowerCase() === 'span'){
                                var rateNum = tg.innerHTML;
                                rateLevel = rateNum;

                                for(var j = 0; j < 5; j++){
                                    if(j < rateNum){
                                        rate[j].className="rate-span active";
                                    }else{
                                        rate[j].className="rate-span";
                                    }
                                }
                            }
                        });
                        addEvent(rateBtns[i], 'click', function() {

                            chatMsg.innerHTML += UUCT.tempMsgItem(1, 'Thank you for your rate!! Goodbye!', new Date());
                            chatMsg.scrollTop = chatMsg.scrollHeight;

                            UUCT.socket.emit('c.rate', UUCT.chat.cid, rateLevel, function (success) {
                                if(success){
                                    setTimeout(function(){
                                        UUCT.socket.close();
                                        UUCT.socket = null;
                                        $('.chat-main').innerHTML = '<div class="reconnect-btn"><img width="32" src="'+UUCT.domain+'/static/images/write.png">New Conversation</div>';
                                        addEvent($('.reconnect-btn'), 'click', function(){
                                            UUCT.createSocket();
                                        });
                                    }, 3000);
                                }
                            });
                        });
                    })(i)
                }

            }else if(msgObj.msg === 2){
                var str = '';
                str += '<div class="new-conversation">Click to New Conversation</div>';
                chatMsg.innerHTML += this.tempMsgItem(msgObj.role, str, new Date());

            }else{
                chatMsg && (chatMsg.innerHTML += this.tempMsgItem(msgObj.role, msgObj.msg, msgObj.time));
            }

            chatMsg && (chatMsg.scrollTop = chatMsg.scrollHeight);
            UUCT.updateLocalStorage();

            $('.new-conversation') && addEvent($('.new-conversation'), 'click', function(){
                UUCT.createSocket();
            });

        },
        dateISOFomat: function(t){
            if(isNaN(new Date(t))){
                t = t.split(/\D/);
                return new Date(Date.UTC(t[0], --t[1]||'', t[2]||'', t[3]||'', t[4]||'', t[5]||'', t[6]||''));
            }else{
                return new Date(t);
            }
        },
        updateLocalStorage: function(userInfo){
            var uuchatIframe = doc.querySelector('#uuchatIframe'),
                uuchatLocalStorage = uuchatIframe.contentWindow.localStorage,
                storage = JSON.parse(uuchatLocalStorage.getItem('uuInfoData')),
                d = new Date();

            if (!storage) {
                return false;
            }

            storage.time.chatTime = d.getTime();
            storage.time.lastTime = d.getTime();
            storage.userInfo.lastScreen = w.location.href;
            if (userInfo) {
                storage.userInfo.name = userInfo.name;
                storage.userInfo.email = userInfo.email;
            }
            uuchatLocalStorage.setItem("uuInfoData", JSON.stringify(storage));
        },
        initCustomer: function(data){
            var msg = UUCT.tempMsg(),
                send = UUCT.tempSend(),
                msgList = '',
                src = (data.photo && data.photo !== '') ? data.photo : 'static/images/ua.png';

            UUCT.chat.cid = data.cid;
            UUCT.chat.csid = data.csid;
            UUCT.chat.csName = data.name;

            $('.chat-name').innerHTML = data.name;
            $('.chat-main').innerHTML = msg;
            $('.chat-main').innerHTML += send;
            $('.avatar-img').setAttribute("src", UUCT.domain+'/'+src);

            if(data.msg.length > 0){
                for(var i = 0, l = data.msg.length; i < l; i++){
                    var msg = data.msg[i];
                    if(msg.type !== 3 && msg.type !== 4){
                        msgList += UUCT.tempMsgItem(msg.type, msg.msg, msg.createdAt);
                    }
                }
                $('.chat-msg').innerHTML += msgList;
            }

        },
        socketConnect: function(){
            this.emit('c.select', UUCT.socketCsSelect);
        },
        socketConnectTimeOut: function(){
            UUCT.timeStart = UUCT.dateISOFomat(new Date());
            clearInterval(UUCT.timeOutTimer);
            UUCT.timeOutTimer = setInterval(function(){
                var timeNow = UUCT.dateISOFomat(new Date());
                if(timeNow.getTime() - UUCT.timeStart.getTime() > UUCT.timeOutSeconds){
                    clearInterval(UUCT.timeOutTimer);
                    UUCT.socket.close();
                }
            }, 2000);

        },
        socketConnectError: function(){
            $('.chat-main').innerHTML = '<div class="chat-offline"><div class="chat-error">Oh! no ! There has error !You can try it later again</div></div>';
        },
        socketDisconnect: function(reason){
            var timeNow = UUCT.dateISOFomat(new Date()),
                tips = 'The customerSuccess has offline, you can try it by refesh the browser at latter';
            if(timeNow.getTime() - UUCT.timeStart.getTime() > UUCT.timeOutSeconds){
                tips = 'Long time no chat, disconnect, you can try it by refesh the browser at latter';
            }
            if(!$('.chat-msg')){
                var msg = UUCT.tempMsg();
                $('.chat-main').innerHTML = msg;
            }
            if($('.new-conversation')){
                return false;
            }
            UUCT.msgTranslate({
                role: 1,
                msg: tips,
                time: new Date()
            });
            UUCT.socketReconnectTips();
            $('.chat-name').innerHTML = UUCT.chat.csName;
            this.close();
            UUCT.socket = null;
        },
        socketCsSelect: function(type, data){
            if(1 === type){
                UUCT.socketConnectTimeOut();
                UUCT.initCustomer(data);
                addEvent($('.chat-emoji-btn'), 'click', function(e){
                    toggleClass($('.emoji-lists'), 'emoji-lists-hidden');
                });
                addEvent($('.emoji-lists'), 'click', function(e){
                    var e = e || window.event,
                        tg = e.target || e.srcElement;

                    if(tg.tagName.toLowerCase() === 'span'){
                        $('.chat-send-area').value += ' '+tg.innerHTML+' ';
                        $('.chat-send-area').focus();
                    }
                });

                $('.chat-upload') && addEvent($('.chat-upload'), 'change', function(e){

                   var _self = this,
                       data = new FormData(),
                       isLt2M = 0;

                    if(!e.target.files[0]){
                        return false;
                    }
                    data.append('image', e.target.files[0]);

                    isLt2M = e.target.files[0].size / 1024 /1024;

                    if(isLt2M >= 2){
                        $('.chat-msg').innerHTML += '<div class="upload-tips">Image must smaller than 2MB!</div>';
                        this.value = '';
                        setTimeout(function(){
                            $('.upload-tips').parentNode.removeChild($('.upload-tips'));
                        }, 2000);
                        return false;
                    }

                   $('.chat-msg').innerHTML += '<div class="upload-tips">Start upload ...</div>';

                   UUCT.ajax({
                       url: UUCT.domain+'/messages/customer/'+UUCT.chat.cid+'/cs/'+UUCT.chat.csid+'/image?f=c',
                       type:'POST',
                       fileType: true,
                       data: data,
                       progress: function(d){
                           if(d.total === 0){
                               $('.upload-tips').innerHTML = 'Upload failed!!!';
                           }else{
                               $('.upload-tips').innerHTML = 'Uploading '+Math.round(d.loaded/d.total*100)+ ' %';
                           }

                           if(d.loaded === d.total){
                               setTimeout(function(){
                                   $('.upload-tips') && $('.upload-tips').parentNode.removeChild($('.upload-tips'));
                               }, 2500);
                           }
                       },
                       success: function(data){
                           var d = JSON.parse(data);
                           if(d.code === 200){
                               UUCT.socketSendMessage(d.msg.resized+'|'+d.msg.original+'|'+d.msg.w+'|'+d.msg.h);
                           }
                       },
                       error: function(e){
                           _self.value = '';
                           if($('.upload-tips')){
                               $('.upload-tips').innerHTML = 'upload image has cros error.';
                               setTimeout(function(){
                                   $('.upload-tips') && $('.upload-tips').parentNode.removeChild($('.upload-tips'));
                               }, 2500);
                           }
                       }
                   });

                });

                addEvent($('.chat-send-area'), 'keypress', function(e){
                    var e = e || w.event,
                        val = this.value;

                    val = val.replace(/>/g, "&gt;").replace(/^\s$/g, "").replace(/</g, "&lt;").replace(/ /gi, '&nbsp;').replace(/\n/gi, '#');

                    if(val !== ''){
                        $('.send-pre').innerHTML = val;
                    }
                    if(13 === e.keyCode){
                        if(val !== '') {
                            UUCT.socketSendMessage(val);
                            $('.send-pre').innerHTML = '';
                            this.value = '';
                            this.focus();
                            this.setAttribute("placeholder", "");
                            addClass($('.emoji-lists'), 'emoji-lists-hidden');
                        }
                        e.returnValue = false;
                        e.preventDefault && e.preventDefault();
                    }

                });
                addEvent($('.chat-send-area'), 'blur', function(e){
                    var e = e || w.event,
                        val = this.value;
                    if(val === ''){
                        $('.send-pre').innerHTML = '';
                    }else{
                        $('.send-pre').innerHTML = val;
                    }
                });

            }else if(2 === type){

                var queue = '<div class="chat-offline"><div class="line-up">Current queue number <i class="line-num">';
                queue += data.num;
                queue += '</i></div></div>';
                $('.chat-main').innerHTML = queue;

            }else if(3 === type){
                UUCT.customerSuccessOffline();
            }
        },
        customerSuccessOffline: function(){
            var offline = UUCT.tempOffline();

            $('.chat-main').innerHTML = offline;
            addEvent($('.offline-name'), 'focus', function(){
                removeClass(this, 'error');
            });
            addEvent($('.offline-email'), 'focus', function(){
                removeClass(this, 'error');
            });
            addEvent($('.offline-text'), 'focus', function(){
                removeClass(this, 'error');
            });

            addEvent($('.offline-send'), 'click', function(){

                var name = $('.offline-name').value,
                    email = $('.offline-email').value,
                    content = $('.offline-text').value,
                    vertify = true;

                if(name === ''){
                    addClass($('.offline-name'), 'error');
                    vertify = false;
                }

                if(email === '' || !/^[0-9a-z_A-Z.\\-]+@(([0-9a-zA-Z]+)[.]){1,2}[a-z]{2,3}$/g.test(email)){
                    addClass($('.offline-email'), 'error');
                    vertify = false;
                }

                if(content === ''){
                    addClass($('.offline-text'), 'error');
                    vertify = false;
                }
                if(!vertify){
                    return false;
                }

                UUCT.updateLocalStorage({
                    name: name,
                    email: email
                });

                UUCT.ajax({
                    url:UUCT.domain+'/offlines',
                    type:'GET',
                    jsonp: 'jsonpCallback',
                    data: {
                        "name": name,
                        "email": email,
                        "content": content
                    },
                    success: function(d){
                        if(d.code === 200){
                            $('.chat-offline').innerHTML = '<div className="offline-text-success"> <div class="offline-success">Thank you for your message!We\'ll get back to you as soon as' +
                                ' possible！</div></div>';
                        }
                    }
                });
            });
        },
        socketReconnectTips: function(){
            UUCT.msgTranslate({
                role: 1,
                msg: 2,
                time: new Date()
            });
        },
        socketDispatch: function(csid, name, avatar){
            UUCT.chat.csid = csid;
            UUCT.chat.name = name;
            $('.chat-name').innerHTML = name;
        },
        socketActionRate: function(){
            UUCT.msgTranslate({
                role: 1,
                msg: 1,
                time: new Date()
            });
        },
        socketSendMessage: function(msg){
            UUCT.socketEmitMessage(UUCT.cutStr(msg, 256));
        },
        socketEmitMessage: function(msg){
            var d = (new Date()).getTime();
            UUCT.timeStart = UUCT.dateISOFomat(new Date());
            UUCT.msgTranslate({
                role: 0,
                msg: msg,
                time: d
            });

            function watchDog(tout, cb) {
                if ('function' === typeof tout) {
                    cb = tout;
                    tout = 5000;
                }
                var called = false;
                var t = setTimeout(function () {
                    if (!called) {
                        called = true;
                        cb(new Error('callback timeout'));
                    }
                }, tout);

                return function () {
                    clearTimeout(t);
                    if (!called) {
                        called = true;
                        [].unshift.call(arguments, undefined);
                        cb.apply(this, arguments);
                    }
                };
            };


            UUCT.socket && UUCT.socket.emit('c.message', UUCT.chat.cid, msg, watchDog(function(err, success){
                if(success){
                    if(/(png|jpg|jpeg|gif)\|/g.test(msg)){
                        addClass($('.t-'+d), 'done-img');
                    }else{
                        addClass($('.t-'+d), 'done');
                    }

                }else{
                    $('.t-'+d).querySelector('.chat-text').innerHTML += '<span class="resend-btn" title="Click to resend">!</span>';
                    var resendBtns = document.querySelectorAll('.resend-btn');

                    for (var i = 0, l = resendBtns.length; i < l; i++) {
                        (function(el){
                            addEvent(el, "click", function(){
                                var resendMsg = this.parentNode.innerHTML.replace('<span class="resend-btn" title="Click to resend">!</span>', '');
                                UUCT.socketEmitMessage(UUCT.cutStr(resendMsg, 256));
                            });
                        })(resendBtns[i]);
                    }
                }
            }));
        },
        socketCsMessage: function(cid, msg){
            var chatNums = $('.chat-nums');
            UUCT.timeStart = UUCT.dateISOFomat(new Date());
            UUCT.msgTranslate({
                role: 1,
                msg: msg,
                time: new Date()
            });

            if(!hasClass($('.chat-btn'), 'chat-btn-close')){
                var n = chatNums.innerHTML;
                n++;
                chatNums.innerHTML = n;
                chatNums.style.display = 'block';
            }
        },
        socketCloseDialog: function(){
            UUCT.msgTranslate({
                role: 1,
                msg: 'The customerSuccess is offline!',
                time: new Date()
            });
            UUCT.socketReconnectTips();
        },
        socketCsStatus: function(status){
            if(1 === status){
                $('.chat-name').innerHTML = '<span class="status-title">Entering</span>';
            }else if(2 === status){
                $('.chat-name').innerHTML = UUCT.chat.csName;
            }
        },
        socketCsDisconnect: function(){
            clearInterval(UUCT.timeOutTimer);
            UUCT.msgTranslate({
                role: 1,
                msg: 'The customerSuccess is offline!',
                time: new Date()
            });
            UUCT.socketReconnectTips();
        },
        socketQueueUpdate: function(pos){
            if($('.line-num')){
                $('.line-num').innerHTML = pos;
            }
        },
        socketQueueShift: function(d){
            if(d){
                UUCT.initCustomer(d);
                UUCT.socketConnectTimeOut();
            }
        },
        socketReconnect: function(){
            UUCT.msgTranslate({
                role: 1,
                msg: 'Reconnect to server success!!!',
                time: new Date()
            });
        },
        socketError: function(){
            UUCT.msgTranslate({
                role: 1,
                msg: 'Its error to connect to the server!!! ',
                time: new Date()
            });
        }
    };


    w.UUCT = UUCT;

    UUCT.init();

})(window, document);
var UUCTemo=[{name:"grinning-smile-eyes",text:"\ud83d\ude01",code:"U+1F601"},{name:"tears-of-joy",text:"\ud83d\ude02",code:"U+1F602"},{name:"smiling-open-mouth",text:"\ud83d\ude03",code:"U+1F603"},{name:"smiling-mouth-eyes",text:"\ud83d\ude04",code:"U+1F604"},{name:"smiling-cold-sweat",text:"\ud83d\ude05",code:"U+1F605"},{name:"smiling-closed-eyes",text:"\ud83d\ude06",code:"U+1F606"},{name:"winking",text:"\ud83d\ude09",code:"U+1F609"},{name:"smiling-eyes",text:"\ud83d\ude0a",code:"U+1F60A"},{name:"delicious-food",
    text:"\ud83d\ude0b",code:"U+1F60B"},{name:"relieved",text:"\ud83d\ude0c",code:"U+1F60C"},{name:"heart-shaped",text:"\ud83d\ude0d",code:"U+1F60D"},{name:"smirking",text:"\ud83d\ude0f",code:"U+1F60F"},{name:"unamused",text:"\ud83d\ude12",code:"U+1F612"},{name:"cold-sweat",text:"\ud83d\ude13",code:"U+1F613"},{name:"pensive",text:"\ud83d\ude14",code:"U+1F614"},{name:"confounded",text:"\ud83d\ude16",code:"U+1F616"},{name:"throwing-kiss",text:"\ud83d\ude18",code:"U+1F618"},{name:"kissing-closed-eyes",text:"\ud83d\ude1a",
    code:"U+1F61A"},{name:"stuck-out-tongue",text:"\ud83d\ude1c",code:"U+1F61C"},{name:"tightly-closed-eyes",text:"\ud83d\ude1d",code:""},{name:"disappointed",text:"\ud83d\ude1e",code:"U+1F61E"},{name:"angry",text:"\ud83d\ude20",code:"U+1F620"},{name:"pouting",text:"\ud83d\ude21",code:"U+1F621"},{name:"crying",text:"\ud83d\ude22",code:"U+1F622"},{name:"persevering",text:"\ud83d\ude23",code:"U+1F623"},{name:"look-of-triumph",text:"\ud83d\ude24",code:"U+1F624"},{name:"disappointed-relieved",text:"\ud83d\ude25",
    code:"U+1F625"},{name:"fearful",text:"\ud83d\ude28",code:"U+1F628"},{name:"weary",text:"\ud83d\ude29",code:"U+1F629"},{name:"sleepy",text:"\ud83d\ude2a",code:"U+1F62A"},{name:"tired",text:"\ud83d\ude2b",code:"U+1F62B"},{name:"loudly-crying ",text:"\ud83d\ude2d",code:"U+1F62D"},{name:"mouth-cold-sweat",text:"\ud83d\ude30",code:"U+1F630"},{name:"screaming-in-fear",text:"\ud83d\ude31",code:"U+1F631"},{name:"astonished",text:"\ud83d\ude32",code:"U+1F632"},{name:"flushed",text:"\ud83d\ude33",code:"U+1F633"},
    {name:"dizzy",text:"\ud83d\ude35",code:"U+1F635"},{name:"medical-mask",text:"\ud83d\ude37",code:"U+1F637"},{name:"hands-in-celebration",text:"\ud83d\ude4c",code:"U+1F64C"},{name:"folded-hands",text:"\ud83d\ude4f",code:"U+1F64F"},{name:"raised-first",text:"\u270a",code:"U+270A"},{name:"raised-hand",text:"\u270b",code:"U+270B"},{name:"victory-hand",text:"\u270c",code:"U+270C"},{name:"ok-hand-sign",text:"\ud83d\udc4c",code:"U+1F44C"},{name:"waving-hand-sign",text:"\ud83d\udc4b",code:"U+1F44B"},{name:"thumbs-up-sign",
        text:"\ud83d\udc4d",code:"U+1F44D"},{name:"clapping-hands-sign",text:"\ud83d\udc4f",code:"U+1F44F"},{name:"kiss-mark",text:"\ud83d\udc8b",code:"U+1F48B"}];

