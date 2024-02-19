	var count = 0;
	var couRou = 0;
	var flg_Conn = 0;
	var Flag_Read = 0;
	var readData = "";
	var link_open = 0;
	var flagDel = 0;
	var flagTimerTemp = 0;
	var copIP = "";
	var updTm = 0;
	var jeso;
	var flagDialog = 0;
	var st = [];
	var timer = [];
	var selCell = []; // Массив для хранения индексов ячеек
	var draw = false;
	var t_hou = 0;
	var t_min = 0;
	var t_tmp = 0;
	var d_ned = 0;
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
	var mqtt;
	const progressCircle = document.querySelector('.prog circle:last-of-type');
	
	window.addEventListener('load', onLoad);
	
 
	function onLoad(event) 
	{
		regServiWork();
		
		startTime();
		//if (localStorage.getItem('bm') === null ) StorWrite();
		//else StorRead();
		//btHouClick(t_hou); //Устанавливаем кнопку переключателей на 00 часов
		timDisp();
		//conGlobal();
		progressCircle.style.setProperty('--percent', 0); 
		for (var i = 0; i < 96; i++) {
			timer[i] = Math.floor(Math.random() * 101);								//Температуру во все ячейки
		}
	}
	
	//функция регистрации Service worker
	function regServiWork() 
	{
		if ('serviceWorker' in navigator){

			navigator.serviceWorker.register('sw.js')
				.then(registration => {
					console.log('Service worker successfully registered', registration);
			})
			.catch(error => {
					console.log('Service worker registration failed', error);
			});
		}
	}
	
	function conGlobal() {
	StorRead();
		var e = (new Date).getTime().toString();
		t = "Web_" + e.substring(e.length - 10);
		mqtt = new Paho.MQTT.Client(host, Number(port), t);
		mqtt.onConnectionLost = onConnectionLost;
		mqtt.onMessageArrived = onMessageArrived;
		
		var options = {
			onSuccess: onConnect,
			userName: UsernameServer,
			useSSL: true,
			password: PasswordServer
		};
		
		console.log("START CONNECT..."),
		console.log(t)
		mqtt.connect(options);
	}

	function sendData(mess)
	{
		if (flg_Conn == 2)
		{	
			var message = new Paho.MQTT.Message(mess);
			message.destinationName = DeviceCode+"/Control";
			message.qos = 0;
			mqtt.send(message);
		}	
	}
	
	function onConnect() 
	{
		var tpd = DeviceCode+"/Data";
		mqtt.subscribe(tpd);
		document.getElementById("ledG").style.backgroundColor = "#34CB98"; //Зеленый цвет светодиода LINK Global MQTT
		jeso = '{'
		+ '"comm":'
		+ '"PWS"'
		+ '}';
		flg_Conn = 2;
		sendData(jeso);
		console.log("Connect!");
	}
	
	function onConnectionLost(responseObject) 
	{
		flg_Conn = 0;
		console.log("NO Connect!");
		document.getElementById("ledG").style.backgroundColor = '#EE566F'; //Красный цвет светодиода LINK Global MQTT
	}

	function onMessageArrived(message) 
	{
		var jsonResp = JSON.parse(message.payloadString);
		parsePaket(jsonResp);
	}
	
	
	function parsePaket(paket) 
	{
		//console.log("Hello world!");
		
		var x;
		var y;
		var z;
		var w;
		
		var jsonResponse = JSON.parse(paket);
		
		y = jsonResponse.x1;
		if (y != -127.0) {
              document.getElementById("temp").innerHTML = y;
			  progressCircle.style.setProperty('--percent', Number(y)); 
        }else {
              document.getElementById("temp").innerHTML = "Error";
			  progressCircle.style.setProperty('--percent', 0); 
        }
		
		curWeek = jsonResponse.x3; 			//Текущий день недели
		switch (curWeek) //День недели
		{
			case 0: w = 'SUNDAY'; break;
			case 1: w = 'MONDAY'; break;
			case 2: w = 'TUESDAY'; break;
			case 3: w = 'WEDNESDAY'; break;
			case 4: w = 'THURSTDAY'; break;
			case 5: w = 'FRIDAY'; break;
			case 6: w = 'SATURDAY'; break
		}
		
		y = Number(jsonResponse.x8); 			//Часы в секундах
		var inHou = y /3600 ^ 0;				//Час
		var inMin = (y-inHou * 3600) /60 ^ 0; 	//Минуты
		document.getElementById("datim").innerHTML = w + " " + (inHou<10 ? "0" + inHou:inHou) + ":" + (inMin<10 ? "0" + inMin:inMin);
		
		y = jsonResponse.x7; //Если нулевой бит в 1 - то MQTT подключен
		if (y & (1 << 0))
		{
			document.getElementById("ledD").style.backgroundColor = "#34CB98"; //Зеленый цвет светодиода LINK MQTT 
		} 
		else document.getElementById("ledD").style.backgroundColor = "#40414D"; //Немного светлее Цвета фона светодиода LINK MQTT
	  
		if (y & (1 << 1)) //Если первый бит 1 - то Обновление настроек WIFI
		{
			host = jsonResponse.x22;
			UsernameServer = jsonResponse.x23;
			PasswordServer = jsonResponse.x24;
			port = jsonResponse.x25;
			
			//document.getElementById("snA").innerHTML = "S/N " + jsonResponse.x17;  	//Серийный номер
			if (jsonResponse.x18 === "") document.getElementById("nameNet").innerHTML = "SELECT WI-FI NETWORK"; //Имя сети
			else {document.getElementById("nameNet").innerHTML = jsonResponse.x18; flagDel = 1;} //Флаг что сеть была сохранена и можно удалять
			document.getElementById("passNet").value = jsonResponse.x19;   //Пароль сети
			//document.getElementById("ver").innerHTML = jsonResponse.x21; //Версия ПО
		
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
				//document.getElementById("locIPT").style.color = '#8f9392'; 			//Светлосерый цвет
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
				count = 0;
			}
		}
		if (flg_Conn == 1)
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
		sendData(jeso);
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
		sendData(jeso);
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
		sendData(jeso);
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
	function timDisp() 
	{
		var xh;
		var xm;
		
		for (var n = 0; n < 96; n++) 
		{
			t_min = n;
			t_hou = 0;
			t_tmp = (timer[n] >> 0) & 0x1FF; //Считываем температуру с младших 9 бит
			if (t_hou < 10) xh = "0" + t_hou;
			else xh = t_hou;
			
			if (t_min < 10) xm = "0" + t_min;
			else xm = t_min;
			if (timer[n] & (1 << 11)) document.getElementById("tn"+n).innerHTML = xh + ":" + xm + " " + t_tmp + "°";
			else document.getElementById("tn"+n).innerHTML = xh + ":" + xm;
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

	function chColor(cell) 
	{
		var currentColor = window.getComputedStyle(cell).getPropertyValue("background-color");	//Получаем текущий цвет фона ячейки
		var ax = cell.parentNode.rowIndex; 									//Получаем индекс строки
		var bx = cell.cellIndex; 											//Получаем индекс столбца
		var cx = (ax * cell.parentNode.cells.length) + bx; 					//Вычисляем номер ячейки
		var del = selCell.indexOf(cx);										//Ищем индекс ячейки в массиве selCell
		
		if (timer[0] & (1 << 11)) {											//Если бит 11 установлен, то таймер с учетом температуры
			if (currentColor === "rgb(255, 140, 0)") {						//Определяем, в каком состоянии находится ячейка
				cell.style.backgroundColor = "rgb(108, 0, 0)"; 				//Если текущий цвет желтый, меняем на красный
				cell.style.color = '#C0C0C0';
				if (del != -1) selCell.splice(del, 1);						//Если ячейка найдена, удаляем ее индекс из массива
				timer[cx] |= (1 << 9);										//Устанавливаем 9 бит в 1 - ячейка выделена в основном массиве
			} else if (currentColor === "rgb(108, 0, 0)") {					//Если текущий цвет красный, меняем на цвет фона
				cell.style.backgroundColor = "rgb(34, 36, 49)";
				cell.style.color = '#8f9392';
				if (del != -1) selCell.splice(del, 1);						//Если ячейка найдена, удаляем ее индекс из массива
				timer[cx] &= ~(1 << 9);										//Сбрасываем 9 бит в 0 - ячейка не выделена в основном массиве
			} else {
				cell.style.backgroundColor = "rgb(255, 140, 0)";			//Если текущий цвет не желтый и не красный, меняем на желтый
				cell.style.color = "rgb(34, 36, 49)";
				var xt = (timer[cx] >> 0) & 0x1FF; 							//Считываем температуру с младших 9 бит
				
				document.getElementById("slidT").value = xt;				//Установка на ползунке температуры нажатой ячейки
				document.getElementById("labTe").innerHTML = xt + "\xB0"; 	//Знак градуса '\xB0'
				var pr = document.getElementById("prTemp");
				pr.style.width = 0;
				var x = (xt-10)/(100-10)*100;
				pr.style.width = x + "%";
				selCell.push(cx);
			}
			if (selCell.length === 0) document.getElementById("dvTrTem").style.display = "none";//Скрываем Div трэкбара если массив индексов выделения пустой
			else document.getElementById("dvTrTem").style.display = "block"; 					//Иначе показываем Div трэкбара
		}
		else {																//Если бит 12 сброшен, то просто таймер
			if (currentColor === "rgb(108, 0, 0)") {						//Если текущий цвет красный, меняем на цвет фона
				cell.style.backgroundColor = "rgb(34, 36, 49)";
				cell.style.color = '#8f9392';
				if (del != -1) selCell.splice(del, 1);						//Если ячейка найдена, удаляем ее индекс из массива
				timer[cx] &= ~(1 << 9);										//Сбрасываем 9 бит в 0 - ячейка не выделена в основном массиве
			}else{
				cell.style.backgroundColor = "rgb(108, 0, 0)"; 				//Если текущий цвет фона, меняем на красный
				cell.style.color = '#C0C0C0';
				if (del != -1) selCell.splice(del, 1);						//Если ячейка найдена, удаляем ее индекс из массива
				timer[cx] |= (1 << 9);										//Устанавливаем 9 бит в 1 - ячейка выделена в основном массиве
			}
		}
	}
	
	//Функция обработки трекбара установки TEMPERATURE
	function SetSlidT(t) 
	{
		document.getElementById("labTe").innerHTML = t + "\xB0"; 				//Знак градуса '\xB0'
		var pr = document.getElementById("prTemp");
		var z = (t-10)/(100-10)*100;
		pr.style.width = z + "%";
		
		selCell.forEach(function(x) {											//Функция типа цикла пробегается по всем индексам массива selCell
		var txt = document.getElementById("tn"+x).innerHTML;					//Вытаскиваем весь текст из ячейки
		var s = txt.substring(0, 5);											//Отделяем время от температуры
			document.getElementById("tn"+x).innerHTML = s + " " + t + "\xB0"; 	//Изменяем температуру во всех выделеных желтым цветом ячейках
		});
	}
	
	//Функция переключателей дней недели в таблице таймеров
	function btWeekClick(dn) {
		
		const buttons = document.querySelectorAll('.btWeek');
			buttons.forEach((button, i) => {						//Сбросить состояние всех кнопок
			button.classList.remove('btWeekAct');
		});
		buttons[dn].classList.add('btWeekAct');					//Установить активное состояние для нажатой кнопки
		d_ned = dn;
	}
	
	//Функция нажатия кнопки Таймер или Таймер с температурой
	function btTiTemp() {
		var element = document.getElementById("btTiTe")
		if (element.classList.contains("tinoT")) 
		{
			document.getElementById("btTiTe").className = "tiTem";
			//document.getElementById("txHaAu").innerHTML = "HAND MODE";
			for (var i = 0; i < 96; i++) {
				timer[i] |= (1 << 11);								//Устанавливаем 11 бит в 1 - Таймер с температурой
			}
		}
		else 
		{
			document.getElementById("btTiTe").className = "tinoT";
			//document.getElementById("txHaAu").innerHTML = "AUTO MODE";
			document.getElementById("dvTrTem").style.display = "none";   //Скрываеем Div трэкбара установка температуры
			for (var i = 0; i < 96; i++) {
				timer[i] &= ~(1 << 11); 								//Сбрасываем 11 бит в 0 - Только таймер
			}
			
		}
		timDisp();
		btDeSele();
    }
	
	//Функция переключателей кнопок COLD - HEAT ХОЛОД-ТЕПЛО
	function btColHea() {
		var element = document.getElementById("btCoHe")
		if (element.classList.contains("tmpCo")) 
		{
			document.getElementById("btCoHe").className = "tmpHe";
			//document.getElementById("txHaAu").innerHTML = "HAND MODE";
			for (var i = 0; i < 96; i++) {
				timer[i] |= (1 << 12);								//Устанавливаем 12 бит в 1 - Режим ТЕПЛО
			}
		}
		else 
		{
			document.getElementById("btCoHe").className = "tmpCo";
			//document.getElementById("txHaAu").innerHTML = "AUTO MODE";
			for (var i = 0; i < 96; i++) {
				timer[i] &= ~(1 << 12); 								//Сбрасываем 12 бит в 0 - Режим ХОЛОД
			}
		}
    }
	
	//Функция снять выделение всех ячеек в таблице таймеров
	function btDeSele() {
		var cells = document.querySelectorAll("#table td");
		cells.forEach(function(cell) {
			cell.style.backgroundColor = "#222431"; // Устанавливаем цвет фона для всех ячеек
			cell.style.color = "#8f9392";			// Устанавливаем цвет текста для всех ячеек
		});
		selCell.length = 0;											//Очищаем весь масив индексов выделеных ячеек
		for (var i = 0; i < 96; i++) {
			timer[i] &= ~(1 << 9);									//Очищаем все биты 9 - Нет выделленых ячеек таймеров
		}
		document.getElementById("dvTrTem").style.display = "none"; 	//Скрываем Div трэкбара установка температуры							
	}
	
	//Функция переключения СУТОЧНЫЙ /НЕДЕЛЬНЫЙ таймер
	function btSutNed() {
		var element = document.getElementById("btSuNe")
		if (element.classList.contains("sutTi")) 
		{
			document.getElementById("btSuNe").className = "nedTi";
			document.getElementById("btTim").className = "tined";
			document.getElementById("lbTim").innerHTML = "SETTING THE WEEKLY TIMER";
			document.getElementById("dvDnNd").style.display = "block";  //Показываем Div кнопок дни недели
			for (var i = 0; i < 96; i++) {
				timer[i] |= (1 << 13);									//Устанавливаем 13 бит в 1 - НЕДЕЛЬНЫЙ Таймер
			}
		}
		else 
		{
			document.getElementById("btSuNe").className = "sutTi";
			document.getElementById("btTim").className = "tisut";
			document.getElementById("lbTim").innerHTML = "SETTING THE DAY TIMER";
			document.getElementById("dvDnNd").style.display = "none";  	//Скрываем Div кнопок дни недели
			for (var i = 0; i < 96; i++) {
				timer[i] &= ~(1 << 13); 								//Сбрасываем 13 бит в 0 - СУТОЧНЫЙ Таймер
			}
		}
	}	
	
	function saveSetTimers() 
	{
		selCell.forEach(function(x) {											//Функция типа цикла пробегается по всем индексам массива selCell
			document.getElementById("tn"+x).style.backgroundColor = "#6C0000"   //Устанавливаем в выделеных ячейках темно красный цвет вместо желтых
			document.getElementById("tn"+x).style.color = "#C0C0C0"   			//Устанавливаем в выделеных ячейках светлосерый цвет текста
		});
		document.getElementById("dvTrTem").style.display = "none"; 				//Скрываем Div трэкбара установка температуры
		
		jeso = {};
		for (var i = 0; i < timer.length; i++) {								//Формирование строки JSON
			var key = i.toString(); 											//Преобразуем индекс в строку
			jeso[key] = timer[i]; 												//Добавляем элемент в объект JSON
		}
		var jsonString = JSON.stringify(jeso);									//Преобразуем объект JSON в строку
		
		var k = '{'
		+ '"comm":'
		+ '"SET"'
		+ ","
		+ '"day":'
		+ '"' + d_ned + '"'
		+ ","
		
		var outPaket = jsonString.replace("{", k);								//Вставляем в пакет комманду и день недели
		
		sendBLE(outPaket);
		
		
		/*
		const cells = document.querySelectorAll('.celT');
		const colorsArray = [];
		
		for (var i = 0; i < cells.length; i++) 
		{
			const color = window.getComputedStyle(cells[i]).getPropertyValue('background-color');
			const matches = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)		//Записываем температуру в основной массив
			if (matches) 
			{
				const colorNumbers = matches.slice(1).join('.');
				colorsArray[i] = colorNumbers;
				if (colorNumbers !== "255.255.255") timer[i] |= (1 << 7); 		//Устанавливаем седьмой бит в 1 - ячейка выделена
				else  timer[i] &= ~(1 << 7); 									//Сбрасываем седьмой бит в 0 - ячейка не выделена
			}
		}
		*/
		//timer[0] |= ((255 << 8) & 0xFF00); 									//Запись числа в старший байт не трогая младший
		console.log(outPaket);
    }
	
	//Функция отправки пакета по блютуз
	function sendBLE(pak) 
	{
		var maxLen = 20;														//Разбиваем строку jsonString на подстроки длиной не более 20 символов
		for (var i = 0; i < pak.length; i += maxLen) {
			var m = pak.substr.substr(i, maxLen);
			writeBt(m);
			setTimeout(function() {
				console.log('Итерация', i);
			}, 500);
		}
	}
	
	//Кнопка обновить время
	function updTim() 
	{
		mqtt.disconnect();
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
		//sendData(jeso);
		sendBLE(jeso);
		//document.getElementById("ltim").style.color = '#8f9392'; //Светло серый цвет
		updTm = 3;
		//console.log(jeso);
	}
	
	//Функция записи значений в хранилище на смартфон или комп
	function StorWrite() 
	{
		localStorage.clear();
		localStorage.setItem('bm','=========');
		localStorage.setItem('us','=========');
		localStorage.setItem('ps','=========');
		localStorage.setItem('po','=========');
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
			flg_Conn = 1; 														//Зеленый цвет светодиода мигающий в таймере LINK BLE 
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
		flg_Conn = 0; 															//Красный цвет светодиода мигающий в таймере LINK BLE 
    }

    function handleCharact(event){
    const jsonPac = new TextDecoder().decode(event.target.value);
    //var jsonRes = JSON.parse(jsonPac);
    //var jsonString = JSON.stringify(jsonPac); // Преобразование объекта JSON в строку
    
	if (Flag_Read == 0) {
      var index = jsonPac.indexOf("{");
      if (index !== -1) {
        Flag_Read = 1;
      }
    }
	
	if (Flag_Read == 1) {
      readData += jsonPac;
      var index = jsonPac.indexOf("}");
      if (index != -1) {
        Flag_Read = 0;
		parsePaket(readData);
		console.log(readData); 
        readData = "";
      }
    } 
	
    //var x1 = jsonString.indexOf('"');
    //var x2 = jsonString.indexOf('"', x1 + 1);

	//	if (x1 !== -1 && x2 !== -1) {
	//		var tou = jsonString.substring(x1 + 1, x2);
	//		var k = tou;
	//		timer[k] = jsonRes[k];
	//	} 
		
	}

    function writeBt(pak) {
		//jeso = '{"comm":"SWF","ssid":"ghj","pasr":"fgt"}';
		const data = new TextEncoder().encode(pak);

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
						flg_Conn = 0; 
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
