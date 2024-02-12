	var count = 0;
	var couRou = 0;
	var flg_Conn = 0;
	var link_open = 0;
	var flagDel = 0;
	var copIP = "";
	var updTm = 0;
	var jeso;
	var flagDialog = 0;
	var st = [];
	var timer = [];
	var draw = false;
	var t_hou = 0;
	var t_min = 0;
	var t_tmp = 170;
	var host = "";
	var UsernameServer = "";
	var PasswordServer = "";
	var port = 0;
	var DeviceCode = "3030F97714A0";  //Взять с базы код устройства, запхнуть в эту переменную
	var bleServer;
    var bleServiceFound;
    var sensorCharacteristicFound;
	var deviceName ='ESP32';
    var bleService = '70b768c5-9033-48b0-abb0-cbeee7d466ad';
    var jsonCharact = 'd1135308-a467-48a5-8e5f-47ef971f519d';
	
	window.addEventListener('load', onLoad);
	
 
	function onLoad(event) 
	{
		regServiWork();
		//startConnect();
		startTime();
		if (localStorage.getItem('bm') === null ) StorWrite();
		else StorRead();
		btHouClick(t_hou); //Устанавливаем кнопку переключателей на 00 часов
		timDisp(t_hou);
		
		const progressCircle = document.querySelector('.prog circle:last-of-type');
		var x = 77;
        progressCircle.style.setProperty('--percent', x); 
	}
	
	function regServiWork() 
	{
		if ('serviceWorker' in navigator){

			navigator.serviceWorker.register('./sw.js')
				.then(registration => {
					console.log('Service worker successfully registered', registration);
			})
			.catch(error => {
					console.log('Service worker registration failed', error);
			});
		}
	}
	
	function startConnect()
	{
		var id = new Date().getTime().toString();
		var clientID = "Web_" + id.substring(id.length - 10);
		client = new Paho.MQTT.Client(host, Number(port), clientID);

		client.onConnectionLost = onConnectionLost;
		client.onMessageArrived = onMessageArrived;
		
		client.connect({
		onSuccess: onConnect, 
		userName : UsernameServer,
		useSSL: true,
		password : PasswordServer });
		console.log("START CONNECT...");
		console.log(clientID);
	}
	
	function sendData(mess)
	{
		if (flg_Conn == 1)
		{	
			var message = new Paho.MQTT.Message(mess);
			message.destinationName = DeviceCode+"/Control";
			message.qos = 0;
			client.send(message);
		}	
	}
	
	function onConnect() 
	{
		var tpd = DeviceCode+"/Data";
		client.subscribe(tpd);
		document.getElementById("ledL").style.color = '#24A9A3';
		jeso = '{'
		+ '"comm":'
		+ '"PWS"'
		+ '}';
		flg_Conn = 1;
		sendData(jeso);
		console.log("Connect!");
	}
	
	function onConnectionLost(responseObject) 
	{
		flg_Conn = 0;
		console.log("NO Connect!");
	}

	function onMessageArrived(message) 
	{
		var jsonResponse = JSON.parse(message.payloadString);
	}
	
	
	function parsePaket() 
	{
		//console.log("Hello world!");
		
		var x;
		var y;
		var z;
	  
		//jsonResponse = JSON.parse(event.data);
		
		y = jsonResponse.x7; //Если нулевой бит в 1 - то MQTT подключен
		if (y & (1 << 0))
		{
			document.getElementById("ledMqt").style.backgroundColor = "#34CB98"; //Зеленый цвет светодиода LINK MQTT 
		} 
		else document.getElementById("ledMqt").style.backgroundColor = "#40414D"; //Немного светлее Цвета фона светодиода LINK MQTT
	  
		if (y & (1 << 1)) //Если первый бит 1 - то Обновление настроек WIFI
		{
			//document.getElementById("snA").innerHTML = "S/N " + jsonResponse.x17;  //Серийный номер
			if (jsonResponse.x18 === "") document.getElementById("nameNet").innerHTML = "SELECT WI-FI NETWORK"; //Имя сети
			else {document.getElementById("nameNet").innerHTML = jsonResponse.x18; flagDel = 1;} //Флаг что сеть была сохранена и можно удалять
			document.getElementById("passNet").value = jsonResponse.x19; //Пароль сети
			document.getElementById("ver").innerHTML = jsonResponse.x21; //Версия ПО
		
			x = jsonResponse.x6; //Флаг подключения к роутеру
			if (x == 0 || x == 5) {
				document.getElementById("locIPT").innerHTML = "NO CONNECTION TO ROUTER";
				clearColorTxtTabl();													//Функция зеленый текст в таблице в цикле очищаем на серый
				//document.getElementById("locIPT").style.color = '#8f9392'; 			//Светлосерый цвет
				couRou = 0;
			}
			else if (x == 2) {
				document.getElementById("locIPT").innerHTML = "CONNECTING TO ROUTER...";
				couRou = 1;
			}
			else if (x == 3) 
			{
				z = jsonResponse.x12;
				document.getElementById("locIPT").innerHTML = "CONNECT - " + document.getElementById("nameNet").innerHTML + " - " + "LOCAL IP " + z;
				//document.getElementById("locIPT").style.color = '#8f9392'; //Светлосерый цвет
				copIP = z;
				couRou = 0;
			}
		}
	 
		if (y & (1 << 3)) //Если Третий бит 1 - то Обновление названия сетей
		{	
			for (var n = 1; n < 7; n++) 
			{
			  document.getElementById("sw"+n).innerHTML="";
			  document.getElementById("mw"+n).innerHTML="";
			  document.getElementById("rw"+n).className = "ceS";
			}
			
			clearColorTxtTabl();	//Функция зеленый текст в таблице в цикле очищаем на серый

			document.getElementById("loader").style.display = "none";
			
			for (var n = 1; n < 7; n++) 
			{
				var h='s'+ n;
				var pos = jsonResponse[h].indexOf('^');
				var poslock = jsonResponse[h].indexOf('*');
				if (pos == -1) break;
				a = jsonResponse[h].substring(0, pos-1);
				b = jsonResponse[h].substring(pos+1, jsonResponse[h].length);

				document.getElementById("sw"+n).innerHTML=b;
				document.getElementById("mw"+n).innerHTML=a+" dBm"
				if (poslock >= 0) 
				{
					document.getElementById("rw"+n).className = "loc";
					st[n] = 0;
				}
				else 
				{
					document.getElementById("rw"+n).className = "uloc";
					st[n] = 1;
				}
				if (b === document.getElementById("nameNet").innerHTML) {
					var table = document.getElementById('tabWF');
					var xs = table.rows[n-1].cells[1];
					xs.style.color = '#34CB98';
				}
			}
			document.getElementById("upNe").innerHTML = "UPDATE LIST"; 
		}  
	}
	
	//Функция таймера
	function startTime() 
	{
	
		if (flg_Conn == 0) 
		{
			if (count == 0) {
				document.getElementById("ledDev").style.backgroundColor = "#EE566F"; //Красный цвет светодиода LINK DEV 
				count = 1;
			}
			else {
				document.getElementById("ledDev").style.backgroundColor = "#40414D"; //Немного светлее Цвета фона светодиода LINK DEV
				document.getElementById("ledMqt").style.backgroundColor = "#40414D"; //Немного светлее Цвета фона светодиода LINK MQTT
				count = 0;
			}
		}
		else
		{
			if (count == 0) {
				document.getElementById("ledDev").style.backgroundColor = "#34CB98"; //Зеленый цвет светодиода LINK DEV
				count = 1;
			}
			else {
				document.getElementById("ledDev").style.backgroundColor = "#40414D"; //Немного светлее Цвета фона светодиода LINK DEV
				count = 0;
			}
		}

		setTimeout(startTime, 1000); 
	}
	
	//Функция обработки кнопки Auto/Hand
	function btAutoHand()
	{
		var element = document.getElementById("btHaAu")
		if (element.classList.contains("btAuto")) 
		{
			document.getElementById("btHaAu").className = "btHand";
			document.getElementById("txHaAu").innerHTML = "HAND MODE";
		}
		else 
		{
			document.getElementById("btHaAu").className = "btAuto";
			document.getElementById("txHaAu").innerHTML = "AUTO MODE";
		}
	}
	
	//Функция обработки кнопки ON/OFF
	function btOnOff()
	{
		var element = document.getElementById("btOnOf");
		if (element.classList.contains("btOn")) 
		{
			document.getElementById("btOnOf").className = "btOff";
		}
		else 
		{
			document.getElementById("btOnOf").className = "btOn";
		}
	}
	
	
	//Функция закрытия всех блоков при нажатии кнопок меню
	function hideBlok()
	{
		document.getElementById("blMain").style.display = "none"; //Скрываем Div Main
		document.getElementById("blSetT").style.display = "none"; //Скрываем Div Setings Timer
		document.getElementById("blSetW").style.display = "none"; //Скрываем Div Wi-Fi settings
	}
	
	//Функция открытия блока Wi-Fi settings
	function menuWf()
	{
		hideBlok();
		document.getElementById("btNaza").style.display = "block";   //Показываем кнопку назад
		document.getElementById("blSetW").style.display = "block";   //Показываем Div Wi-Fi settings
		
	}
	
	//Функция переход на страницу настройки таймеров
	function btSetTim()
	{
		hideBlok();
		document.getElementById("btNaza").style.display = "block"; //Показываем кнопку назад
		document.getElementById("blSetT").style.display = "block"; //Показываем Div Setings Timer
	}
	
	//Функция нажатие кнопки назад
	function btNazad()
	{
		hideBlok();
		document.getElementById("btNaza").style.display = "none";  //Скрываем кнопку назад
		document.getElementById("blMain").style.display = "block"; //Показываем Div Setings Timer
	}
	
	//Функция обработки трекбара установки MAX TEMPERATURE
	function SetSlidTR5(t5) 
	{
		document.getElementById("labTR5").innerHTML = t5 + "\xB0"; //Знак градуса '\xB0'
		var pr = document.getElementById("prTeR5");
		var x = (t5-10)/(100-10)*100;
		pr.style.width = x + "%";
	}
	
	//Функция функция сохранения значений трэкбаров
	function SaveDevSet()
	{
	console.log("Hello world!");
		//alert("I am an alert box!");
	}
	
	//Функция открытия диалогового окна
	function showDialog(xs) {
		
		if (xs == 1){
			document.getElementById("diTxt").innerHTML = "No network selected! Select a network and try again."
			document.getElementById("btYe").style.display = "none";
			document.getElementById("btNo").innerHTML = "OK";
		}
		else if (xs == 2){
			document.getElementById("diTxt").innerHTML = "The password field is empty! Enter password."
			document.getElementById("btYe").style.display = "none";
			document.getElementById("btNo").innerHTML = "OK";
		}
		else if (xs == 3){
			document.getElementById("diTxt").innerHTML = "No network selected! Select a network from the list."
			document.getElementById("btYe").style.display = "none";
			document.getElementById("btNo").innerHTML = "OK";
		}
		else if (xs == 4){
			document.getElementById("diTxt").innerHTML = "The device is not yet connected to the network!"
			document.getElementById("btYe").style.display = "none";
			document.getElementById("btNo").innerHTML = "OK";
		}
		else if (xs == 5){
			document.getElementById("diTxt").innerHTML = "The network connection will be deleted! Continue?"
			document.getElementById("btYe").style.display = "block";
			document.getElementById("btNo").innerHTML = "NO";
		}
		
		document.getElementById('overs').classList.add('show');
	
    }
	
	//Функция диалогового окна, кнопка No
	function btNoDialog() {
		document.getElementById('overs').classList.remove('show');
    }

	//Функция диалогового окна, кнопка Yes
	function btYesDialog() {
        if (flagDialog == 5) {
			delRouter();
		}
		document.getElementById('overs').classList.remove('show');
    }
	
	//Функция зеленый текст в таблице в цикле очищаем на серый
	function clearColorTxtTabl() 
	{
		var xs;
		var table = document.getElementById('tabWF');
		for (var s = 0; s < table.rows.length; s++) {
			xs = table.rows[s].cells[1];
			xs.style.color = '#8f9392';
		}
	}
	
	//Функция вставки имени сети, подсветка текста выбранной ячейки
	function pNet(o) 
	{
		if (o.innerHTML.length != 0) 
		{
			var table = document.getElementById('tabWF');
			var xs;
			var cell = event.target;
			var i = cell.parentNode.rowIndex; 	//Номер строки
			var j = cell.cellIndex; 			//Номер столбца
			
			clearColorTxtTabl();
			
			document.getElementById("nameNet").innerHTML = o.innerHTML;
			i++;
			if (st[i] == 1) link_open = 1; 		//Открытая сеть
			else link_open = 0;  			 	//Закрытая сеть
			xs = table.rows[i-1].cells[j];
			xs.style.color = '#34CB98';
		}
	}
	
	//Кнопка удалить подключение к роутеру
	function delRouter() 
	{
		//Проверяем на пустоту поле название сети
		var s = document.getElementById("nameNet").innerHTML;
		if (s === "SELECT WI-FI NETWORK") 
		{
			flagDialog = 3; showDialog(flagDialog);
			return false;
		}
		if (flagDel == 0) 
		{
			flagDialog = 4; showDialog(flagDialog);
			return false;
		}
		if (flagDel == 1 && flagDialog != 5) 
		{
			flagDialog = 5; showDialog(flagDialog);
			return false;
		}
		
		jeso = '{'
		+ '"comm":'
		+ '"DLR"'
		+ '}';
		websocket.send(jeso);
		flagDel = 0; //Збрасываем флаг от повторного нажатия на корзину
		flagDialog = 0;
	}
	
	//Кнопка сохранения настроек сети WiFi
	function saveNet()
	{
		//Проверяем на пустоту поле название сети
		var s = document.getElementById("nameNet").innerHTML;

		if (s === "SELECT WI-FI NETWORK") 
		{
			flagDialog = 1; showDialog(flagDialog);
			return false;
		}
		else
		{
			if (link_open == 0){								//Если сеть закрыта
				
				s = document.getElementById("passNet").value; 	//Проверяем на пустоту поле пароля
				x = s.length;
				if (x == 0) 
				{
					flagDialog = 2; showDialog(flagDialog);
					return false;
				}
			}
		}
	
		jeso = '{'
		+ '"comm":'
		+ '"SWF"'
		+ ","
		+ '"ssid":'
		+ '"' + document.getElementById("nameNet").innerHTML + '"'
		+ ","
		+ '"pasr":'
		+ '"'+ document.getElementById("passNet").value + '"'
		+ '}';
		websocket.send(jeso);
		//document.getElementById("btSav").style.color = '#BABDB6'; //Серый цвет
	}
	
	//Кнопка обновить список сети
	function updatNet()
	{
		//Проверяем на пустоту поле название сети
		var s = document.getElementById("upNe").innerHTML;
		if (s === "SCANNING AVAILABLE NETWORKS...") 
		{
			return false;
		}

		document.getElementById("upNe").innerHTML = "SCANNING AVAILABLE NETWORKS...";
		document.getElementById("loader").style.display = "block";

		jeso = '{'
		+ '"comm":'
		+ '"UPN"'
		+ '}';
		websocket.send(jeso);
	}
	
	//Функция показать / скрыть пароль
	function shoHiPass(target){
		var input = document.getElementById('passNet');
		if (input.getAttribute('type') == 'password') {
			target.classList.add('view');
			input.setAttribute('type', 'text');
		} else {
			target.classList.remove('view');
			input.setAttribute('type', 'password');
		}
		return false;
	}
	
	
	//Функция обработки кнопок выделения времени в таблице таймеров
	document.getElementById("table").addEventListener("mousedown", function () {
		draw = true;
	});
	document.getElementById("table").addEventListener("mouseup", function () {
		draw = false;
	});

	//Функция обработки кнопок выделения времени в таблице таймеров
	function timDisp(h) 
	{
		var xh;
		var xm;
		
		for (var n = 0; n < 60; n++) 
		{
			t_min = n;
			t_hou = h;
			if (t_hou < 10) xh = "0" + t_hou;
			else xh = t_hou;
			
			if (t_min < 10) xm = "0" + t_min;
			else xm = t_min;
			
			document.getElementById("tn"+n).innerHTML = t_tmp + "° " + xh + ":" + xm;
		}
	}
	//Функция обработки кнопок выделения времени в таблице таймеров
	function pPres(cell) 
	{
		if (draw) 
		{
			chColor(cell);
		}
	}

	//Функция обработки кнопок выделения времени в таблице таймеров
    function chColor(cell) 
	{
      cell.classList.toggle('active');
    }

	function saveSetTimers() 
	{
		const cells = document.querySelectorAll('.celF');
		const colorsArray = [];
		var timer = [];
		
		for (var i = 0; i < cells.length; i++) 
		{
			const color = window.getComputedStyle(cells[i]).getPropertyValue('background-color');
			const matches = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

			if (matches) 
			{
				const colorNumbers = matches.slice(1).join('.');
				colorsArray[i] = colorNumbers;
				if (colorNumbers !== "255.255.255") timer[i] |= (1 << 7); //Устанавливаем седьмой бит в 1 - ячейка выделена
				else  timer[i] &= ~(1 << 7); 								//Сбрасываем седьмой бит в 0 - ячейка не выделена
			}
		}

		// Log the colors array
		//timer[0] |= ((255 << 8) & 0xFF00); 								//Запись числа в старший байт не трогая младший
		timer[0] |= (100 & 0x7F);
		var setTempApp = (timer[0] >> 0) & 0x7F;
		console.log(colorsArray);
		console.log(timer);
		console.log(setTempApp);
    }
	
	//Функция обработки кнопок выделения времени в таблице таймеров
	function reset() {
		const cells = document.querySelectorAll('.celF');

		cells.forEach(cell => {
		  cell.classList.remove('active');
		});
	}
	
	//Функция переключателей кнопок времени в таблице таймеров
	function btHouClick(inbt) {
		timDisp(inbt);
		const buttons = document.querySelectorAll('.btHou');
			buttons.forEach((button, i) => {						//Сбросить состояние всех кнопок
			button.classList.remove('dtHouAct');
		});
		buttons[inbt].classList.add('dtHouAct');					//Установить активное состояние для нажатой кнопки
	}
	
	//Функция переключателей дней недели в таблице таймеров
	function btWeekClick(inbt) {
		
		const buttons = document.querySelectorAll('.btWeek');
			buttons.forEach((button, i) => {						//Сбросить состояние всех кнопок
			button.classList.remove('btWeekAct');
		});
		buttons[inbt].classList.add('btWeekAct');					//Установить активное состояние для нажатой кнопки
	}
	
	//Функция нажатия кнопки Таймер или Таймер с температурой
	function btTiTemp() {
      const button = document.getElementById('btTiTe');
      button.classList.toggle('active');

      if (button.classList.contains('active')) {
        button.innerHTML = 'TIMER & TEMP';
      } else {
        button.innerHTML = 'TIMER';
      }
    }
	
	//Функция переключателей кнопок COLD - HEAT ХОЛОД-ТЕПЛО
	function btColHea() {
      const button = document.getElementById('btCoHe');
      button.classList.toggle('active');

      if (button.classList.contains('active')) {
        document.getElementById("btSetT").className = "tmpCo";
		button.innerHTML = 'HEAT MODE';
      } else {
        button.innerHTML = 'COLD MODE';
		document.getElementById("btSetT").className = "tmpHe";
      }
    }
	
	//Кнопка обновить время
	function updTim() 
	{
		var tz;
		var date = new Date();
		var ofs = new Date().getTimezoneOffset();
		if (ofs < 0) tz = ofs / -60; else tz = ofs / 60;

		var h = date.getHours();
		var m = date.getMinutes();
		var s = date.getSeconds();
		var y = date.getFullYear();
		var mo = date.getMonth() + 1;
		var da = date.getDate();
		var we = date.getDay();
		var ye = String(y).substring(2); //Преобразовываем в строку и копируем со второго символа и до конца строки
		if (we == 0) we = 7;
		jeso = '{'
		+ '"comm":'
		+ '"DAT"'
		+ ","
		+ '"ho":'
		+ '"' + h + '"'
		+ ","
		+ '"mi":'
		+ '"'+ m + '"'
		+ ","
		+ '"se":'
		+ '"'+ s + '"'
		+ ","
		+ '"ye":'
		+ '"' + ye + '"'
		+ ","
		+ '"mo":'
		+ '"' + mo + '"'
		+ ","
		+ '"da":'
		+ '"' + da + '"'
		+ ","
		+ '"we":'
		+ '"'+ we + '"'
		+ ","
		+ '"tz":'
		+ '"'+ tz + '"'
		+ '}';
		ouData(jeso);
		document.getElementById("ltim").style.color = '#8f9392'; //Светло серый цвет
		updTm = 3;
		//console.log(jeso);
	}
	
	//Функция записи значений в хранилище на смартфон или комп
	function StorWrite() 
	{
		localStorage.clear();
		localStorage.setItem('bm','m15.cloudmqtt.com');
		localStorage.setItem('us','cxjuzzzn');
		localStorage.setItem('ps','Jevkda5wZkhl');
		localStorage.setItem('po','32669');
	}
	
	//Функция чтения значений хранилища из смартфона или компа
	function StorRead() 
	{
		host = localStorage.getItem('bm');
		UsernameServer = localStorage.getItem('us');
		PasswordServer = localStorage.getItem('ps');
		port = localStorage.getItem('po');
	}
	
	
	//========================  Функции работы с блютузом  =======================================================
	function bleOnOff() {
		var element = document.getElementById("conBle");
		if (element.classList.contains("bleOf")) 
		{
			btConBLE();
		}
		else 
		{
			Disconnect();
		}
	}

	function btConBLE(){
        navigator.bluetooth.requestDevice({
            filters: [{name: deviceName}],
            optionalServices: [bleService]
        })
        .then(device => {
            device.addEventListener('gattservicedisconnected', onDisconnected);
			document.getElementById("conBle").className = "bleOn";
            return device.gatt.connect();
        })
        .then(gattServer =>{
            bleServer = gattServer;
            return bleServer.getPrimaryService(bleService);
        })
        .then(service => {
            bleServiceFound = service;
            return service.getCharacteristic(jsonCharact);
        })
        .then(characteristic => {
			sensorCharacteristicFound = characteristic;
            characteristic.addEventListener('characteristicvaluechanged', handleCharact);
            characteristic.startNotifications();
            return characteristic.readValue();
        })
        .catch(error => {
            console.log('Connect Bluetooth Error: ', error);
        })
    }
	

    function onDisconnected(event){
         document.getElementById("conBle").className = "bleOf";
    }

    function handleCharact(event){
    const jsonPac = new TextDecoder().decode(event.target.value);
    var jsonRes = JSON.parse(jsonPac);
    console.log(jsonRes);
    
    var jsonString = JSON.stringify(jsonRes); // Преобразование объекта JSON в строку
    
    var x1 = jsonString.indexOf('"');
    var x2 = jsonString.indexOf('"', x1 + 1);

		if (x1 !== -1 && x2 !== -1) {
			var tou = jsonString.substring(x1 + 1, x2);
			var k = tou;
			timer[k] = jsonRes[k];
		} 
		console.log(k); 
	}

    function writeOnCharacteristic() {
		jeso = '{"comm":"SWF","ssid":"ghj","pasr":"fgt"}';
		const data = new TextEncoder().encode(jeso);

		if (bleServer && bleServer.connected) {
			bleServiceFound.getCharacteristic(jsonCharact)
			.then(characteristic => {
				console.log("Found the LED characteristic: ", characteristic.uuid);
				return characteristic.writeValue(data);
			})
			.catch(error => {
				console.error("Error writing to the LED characteristic: ", error);
			});
		} 
		else 
		{
			console.error("Bluetooth is not connected. Cannot write to characteristic.");
			window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!");
		}
	}

    function Disconnect() {
	
        if (bleServer && bleServer.connected) {
            if (sensorCharacteristicFound) {
                sensorCharacteristicFound.stopNotifications()
                    .then(() => {
                        console.log("Notifications Stopped");
                        return bleServer.disconnect();
                    })
                    .then(() => {
                        console.log("Device Disconnected");
                        document.getElementById("conBle").className = "bleOf";

                    })
                    .catch(error => {
                        console.log("An error occurred:", error);
                    });
            } else {
                console.log("No characteristic found to disconnect.");
            }
        } else {
            
            console.error("Bluetooth is not connected."); 
        }
    }