// ==UserScript==
// @name         Pestinator
// @namespace    https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.js
// @version      0.303
// @description  Provides various helper functions to PestPac and ServSuite, customized to our particular use-case.
// @author       Ryan Huffaker
// @match        app.west.pestpac.com/*
// @match        sprolive.theservicepro.net/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        window.focus
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function urlContains(list){
        let yesItDoes = false;
        for(let i = 0; i < list.length; i++){
            if(window.location.href.indexOf(list[i]) > -1) {
                yesItDoes = true;
            }
        }
        return yesItDoes;
    }

    function retrieveCSS(){
        var link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);
    }

    function getElementsStartsWithId( id ) {
        var children = document.body.getElementsByTagName('*');
        var elements = [], child;
        for (var i = 0, length = children.length; i < length; i++) {
            child = children[i];
            if (child.id.substr(0, id.length) == id) elements.push(child);
        }
        return elements;
    }

    function getSsid(){
        const xpath = "//span[text()='ServSuite']";
        const servSuiteLabel = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const servSuiteText = servSuiteLabel.parentElement.lastChild;
        const ssid = servSuiteText.textContent.substring(2);
    //    return ("0000" + ssid).slice(-5);
        return ssid;
    }

    function getWeekday(input){
        const date = new Date(input);
        return ["SUN","MON","TUE","WED","THU","FRI","SAT"][date.getDay()];
    }

    function getWeek(input){
        const date = new Date(input);
        let week = Math.ceil(date.getDate()/7);
        return week < 5 ? week : 4;
    }

    function getMonth(input){
        const date = new Date(input);
        return ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][date.getMonth()];
    }

    function convertService(service){
        console.log(service);
        let serviceCode;
        [
            { input: "General Pest Control - Weekly", output: "PC-WEEKLY" },
            { input: "General Pest Control - Monthly", output: "PC-MONTHLY" },
            { input: "General Pest Control - Bi Monthly", output: "PC-BIMONTHLY" },
            { input: "General Pest Control - Quarterly", output: "PC-QUARTERLY" },
            { input: "Warranty Inspection", output: "T-RENEWAL" },
            { input: "Termite Inspection Only", output: "T-INSPECTION" }

        ].forEach((obj)=>{
            if(service === obj.input){
                serviceCode = obj.output
            }
        });
        return serviceCode;
    }

    function parseSchedule(service, month, week, day){
        let frequency;
        [
            { input: "PC-WEEKLY", output: "W" },
            { input: "PC-MONTHLY", output: "M" },
            { input: "PC-BIMONTHLY", output: "B" },
            { input: "PC-QUARTERLY", output: "Q" },
            { input: "T-RENEWAL", output: "ANNUAL" },
            { input: "T-INSPECTION", output: "ANNUAL" }

        ].forEach((obj)=>{
            if(service === obj.input){
                frequency = obj.output;
            }
        });
        if(frequency==="ANNUAL"){
            return frequency+month;
        } else if(frequency==="W"){
            return frequency+day;
        } else if(frequency==="M"){
            return frequency+week+day;
        } else if(frequency==="B"){
            if(month==="JAN" || month==="MAR" || month==="MAY" || month==="JUL" || month==="SEP" || month==="NOV"){
                return "BJAN"+week+day;
            } else if(month==="FEB" || month==="APR" || month==="JUN" || month==="AUG" || month==="OCT" || month==="DEC"){
                return "BFEB"+week+day;
            }
        } else if(frequency==="Q"){
            if(month==="JAN" || month==="APR" || month==="JUL" || month==="OCT"){
                return "QJAN"+week+day;
            } else if(month==="FEB" || month==="MAY" || month==="AUG" || month==="NOV"){
                return "QFEB"+week+day;
            } else if(month==="MAR" || month==="JUN" || month==="SEP" || month==="DEC"){
                return "QMAR"+week+day;
            }
            return frequency+month+week+day;
        }
    }

    function execute(commands){
        let command = commands.shift();

        setTimeout(()=>{
            let errors = [];
            if(command.input){
                try {
                    const input = document.getElementById(command.input.target);
                    input.focus();
                    input.value = command.input.value;
                    input.blur();
                } catch(e){
                    errors.push(e)
                }
            } else if(command.click){
                try {
                    document.getElementById(command.click).click();
                } catch(e){
                    errors.push(e)
                }
            } else if(command.open){
                window.open(command.open);
            }
            if(errors.length < 1 && commands.length > 0){
                console.log(commands);
                execute(commands);
            }
        },100);
    }

    const initializePestinator = () => {
        if(urlContains(["app.west.pestpac.com/location/detail.asp"])){
            retrieveCSS();
            ppLocationDetail();
        }
        if(urlContains(["app.west.pestpac.com/location/edit.asp"])){
            retrieveCSS();
            ppLocationEdit();
        }
        if(urlContains(["app.west.pestpac.com/search/default.asp"])){
            retrieveCSS();
            ppSearchDefault();
        }
        if(urlContains(["app.west.pestpac.com/serviceSetup/detail.asp"])){
            retrieveCSS();
            ppServiceSetup();
        }
        if(urlContains(["sprolive.theservicepro.net/user/home.aspx"])){
            retrieveCSS();
            ssHome();
        }
        if(urlContains(["sprolive.theservicepro.net/account/customerhome.aspx"])){
            retrieveCSS();
            ssCustomerHome();
        }
    }

    const ppLocationDetail = () => {
        const ssid = getSsid();

        if(ssid.length < 5){
            GM_setValue('quicksave', true);
            execute([{click:'locationHeaderDetailLink'}]);
        }


        const goToSSHandler = () => {
            window.open('https://sprolive.theservicepro.net/user/home.aspx');
            const ssid = getSsid();
            GM_setValue('PP_to_SS', {id: ssid});
        }

        const addServiceSetup = () => {
            document.getElementById('recurringServicesContainer').children[0].children[0].children[0].children[1].click();
            document.getElementsByClassName('pendo-location-recurring-service__add-setup')[0].click();
        }

        const ssLink = document.createElement('button');
        ssLink.innerHTML = 'ServSuite';
        ssLink.style.cursor = 'pointer';
        ssLink.classList.add('pestinated');
        ssLink.onclick = goToSSHandler;

        const pageHeader = document.getElementById('page-header');
        pageHeader.appendChild(ssLink);

        GM_deleteValue('SS_to_PP');

        GM_addValueChangeListener('SS_program', function(name, old_value, new_value, remote){});

        GM_addValueChangeListener('SS_program', function(name, old_value, SS_program, remote){
            if(!SS_program) return;
            window.focus();
            setTimeout(()=>{
              //  if(confirm("Transfer service from "+SS_program.id+" to "+ssid+"?")){
                    addServiceSetup();
              //  }
            },500)

        });
    }

    const ppLocationEdit = () => {
        const taxCodeInput = document.getElementById('TaxCode');
        taxCodeInput.focus();
        taxCodeInput.value = 'NO TAX';
        taxCodeInput.click();
        taxCodeInput.blur();

        const ssInput = document.getElementById('UserDef1');
        const ssid = ssInput.value;
        ssInput.value = ("0000" + ssid).slice(-5);

        const directionsInput = document.getElementById('Directions');
        if(!directionsInput.value.match(/\*/g)){
            directionsInput.value = "** "+directionsInput.value;
        }
        if(GM_getValue('quicksave')){
            GM_deleteValue('quicksave');
            execute([{click:'butSave'}])
        }
    }

    const ppSearchDefault = () => {

        const goToPPListener = (PPID) => {
            const ssInput = document.getElementsByName('UserDef1')[0];
            ssInput.focus();
            ssInput.value = PPID;
            document.getElementById('butSearch').click();
        }

        const SS_to_PP = GM_getValue('SS_to_PP');
        GM_deleteValue('SS_to_PP');

        console.log(SS_to_PP);


        if(SS_to_PP){
            goToPPListener(SS_to_PP.id);
        }
    }

    const ssHome = () => {

        console.log('ssHome');
        const goToSSListener = (ssid) => {
            const txtSearchCriteria = document.getElementById("txtSearchCriteria");
            txtSearchCriteria.focus();
            txtSearchCriteria.value = ssid;
            GM_deleteValue('PP_to_SS');
            document.getElementById('search_button').click();
            setTimeout(() => {
                window.close();
            }, 3000);
        }

        const PP_to_SS = GM_getValue('PP_to_SS');

        if(PP_to_SS){
            goToSSListener(PP_to_SS.id);
        }
    }

    const ssCustomerHome = () => {
        const goToPPHandler = () => {
            const newWindow = window.open('https://app.west.pestpac.com/search/default.asp');
            const id = document.getElementById('lbeditaccount').textContent.split(' ')[2];
            GM_setValue('SS_to_PP', {id: id});
        }

        const findSiteAddress = (target) => {
            const siteHeaderRow = target
                                 .parentElement.parentElement.parentElement.parentElement.parentElement
                                 .parentElement.parentElement.parentElement.parentElement.parentElement
                                 .parentElement.parentElement.parentElement.parentElement.parentElement
                                 .parentElement.parentElement.parentElement.parentElement.parentElement.children[0];
            const address1 = siteHeaderRow.children[6]+" "+siteHeaderRow.children[7];
        }

        const ppLink = document.createElement('button');
        ppLink.innerHTML = 'PestPac';
        ppLink.classList.add("pestinated");
        ppLink.onclick = goToPPHandler;
        const accountLink = document.getElementById('lbeditaccount');
        accountLink.parentElement.appendChild(ppLink);




        setTimeout(()=>{
            const programTables = document.getElementsByClassName('programdetails');

            const siteHeaders = document.getElementsByClassName('siteheaderrow');

            const programRow = getElementsStartsWithId('trEventRow');

            let programDetails = [];

            const copyProgram = (e) => {
                let program = programDetails[e.target.id.split('_')[1]];
                program.id = document.getElementById('lbeditaccount').textContent.split(' ')[2];
                GM_setValue('SS_program','');
                GM_setValue('SS_program', program);
            }

            Array.from(programRow).forEach((row, i) => {
                let program = {};
                if(row.children){
                    program.service = row.children[1].children[0].textContent;
                    program.lastDate = row.children[2].textContent;
                    program.nextDate = row.children[3].textContent;
                    program.ammount = row.children[5].textContent;
                    program.route = row.children[7].textContent;

                    const ppLink = document.createElement('button');
                    ppLink.innerHTML = 'PP';
                    ppLink.id = 'ppLink_'+i;
                    ppLink.onclick = (e) => { e.preventDefault(); copyProgram(e); }
                    row.children[0].replaceChildren(ppLink);
                }
                programDetails.push(program);
            });
        },2000);
    }

    const ppServiceSetup = () => {
        const enterSetupDetails = (program) => {
            const lastDate = new Date(program.lastDate)
            const weekday = getWeekday(lastDate);
            const week = getWeek(lastDate);
            const month = getMonth(lastDate);
            const serviceCode = convertService(program.service);
            const schedule = parseSchedule(serviceCode, month, week, weekday);
            const ammount = parseInt(program.ammount.replace('$',''));
            let duration = 25;

            if(ammount > 175){
                duration = 200;
            } else if(ammount > 150){
                duration = 130;
            } else if(ammount > 125){
                duration = 115;
            } else if(ammount > 100){
                duration = 100;
            } else if(ammount > 90){
                duration = 55
            } else if(ammount > 80){
                duration = 50
            } else if(ammount > 70){
                duration = 40
            } else if(ammount > 60){
                duration = 35
            }

            execute([
                {
                    input: {
                        target: 'ServiceCode1',
                        value: serviceCode
                    }
                },
                {
                    input: {
                        target: 'UnitPrice1',
                        value: ammount
                    }
                },
                {
                    input: {
                        target: 'Schedule',
                        value: schedule
                    }
                },
                {
                    input: {
                        target: 'Route',
                        value: program.route.substring(0,1)
                    }
                },
                {
                    input: {
                        target: 'Duration',
                        value: duration
                    }
                },
                {
                    click: 'AnyTimeSpan2'
                }
            ]);

            /*
            const serviceCodeInput = document.getElementById('ServiceCode1');
            const unitPriceInput = document.getElementById('UnitPrice1');
            const scheduleInput = document.getElementById('Schedule');
            const routeInput = document.getElementById('Route');

            serviceCodeInput.focus();
            serviceCodeInput.value = serviceCode;
            serviceCodeInput.blur();

            scheduleInput.focus();
            scheduleInput.value = schedule;
            scheduleInput.blur();

            unitPriceInput.focus();
            unitPriceInput.value = program.ammount.replace('$','');
            unitPriceInput.blur();

            routeInput.focus();
            routeInput.value = program.route.substring(0,1);
            routeInput.blur();
            */
        }

        const program = GM_getValue('SS_program');
        GM_setValue('SS_program','');

        if(program) enterSetupDetails(program);

    }

    initializePestinator();

})();