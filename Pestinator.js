// ==UserScript==
// @name         Pestinator
// @namespace    https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.js
// @version      0.309
// @description  Provides various helper functions to PestPac and ServSuite, customized to our particular use-case.
// @author       Ryan Huffaker
// @match        app.west.pestpac.com/*
// @match        sprolive.theservicepro.net/*
// @match        organicspiderman.fieldroutes.com/*
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

    function getOldAccount(){
        const xpath = "//span[text()='OldAccount']";
        const oldAccountLabel = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const oldAccountText = oldAccountLabel.parentElement.lastChild;
        const oldAccount = oldAccountText.textContent.substring(2);
        return oldAccount;
    }

    function goToAccount(accountId, openWindow){
        var quickSearchField = document.getElementById("quicksearchfield");
        quickSearchField.value = accountId;

        var keyUpEvent = document.createEvent("Event");
        keyUpEvent.initEvent('keyup');
        quickSearchField.dispatchEvent(keyUpEvent);

        var i = 0;
        var clickInterval = setInterval(function(){
            i++;
            var searchResults = document.getElementsByClassName("quick-search-result");
            if(searchResults.length > 0){
                clearInterval(clickInterval);

                var pattern = new RegExp(/'(.*?)'/g);
                var onclickText = searchResults[0].getAttribute('onclick');
                var newURL = pattern.exec(onclickText)[0].replaceAll("'", "");

                if(openWindow){
                    var newWindow = window.open("https://app.west.pestpac.com"+newURL);
                    quickSearchField.value = "";
                    document.getElementsByClassName("actions")[0].children[1].click();
                } else {
                    window.location.href="https://app.west.pestpac.com"+newURL;
                }
            }

            if(i > 10) clearInterval(clickInterval);
        }, 100);
    }

    function traverseAccounts(forward, startID){
        var newID = forward ? startID+1 : startID-1;
        goToAccount(newID);
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
            { input: "General Pest Control - Semi Annual", output: "PC-SEMIANNUAL" },
            { input: "Rodent Control - Monthly", output: "R-MONTHLY" },
            { input: "Rodent Control - Bi Monthly", output: "R-BIMONTHLY" },
            { input: "Rodent Control - Quarterly", output: "R-QUARTERLY" },
            { input: "Warranty Inspection", output: "T-RENEWAL" },
            { input: "Termite Inspection Only", output: "T-INSPECTION" },
            { input: "Moisture Control Inspection", output: "M-INSPECTION" }

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
            { input: "PC-SEMIANNUAL", output: "SEMI" },
            { input: "R-MONTHLY", output: "M" },
            { input: "R-BIMONTHLY", output: "B" },
            { input: "R-QUARTERLY", output: "Q" },
            { input: "T-RENEWAL", output: "ANNUAL" },
            { input: "T-INSPECTION", output: "ANNUAL" },
            { input: "M-INSPECTION", output: "ANNUAL" }

        ].forEach((obj)=>{
            if(service === obj.input){
                frequency = obj.output;
            }
        });
        if(frequency==="SEMI" || frequency==="ANNUAL"){
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

            console.log(command);

            let errors = [];
            if(!command.conditional){
                if(command.input && command.input.value){
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
            }

            if(errors.length < 1 && commands.length > 0){
                execute(commands);
            }
        }, 100);
    }

    const initializePestinator = () => {
        if(urlContains(["app.west.pestpac.com"])){
            traversinator();
        }

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
        if(urlContains(["organicspiderman.fieldroutes.com/customers"])){
            prCustomers();
        }
    }

    function traversinator(){

        findAccountListener();

        if(!urlContains(["location/detail.asp?LocationID"])) return;

        var advancedSearchWrapper = document.getElementsByClassName("advanced-search-wrapper")[0];
        var locationHeaderDetailLink = document.getElementById("locationHeaderDetailLink");

        if(!locationHeaderDetailLink) return;

        advancedSearchWrapper.appendChild(createTraverseDiv());

        function createTraverseDiv(){
            var traverseDiv = document.createElement("div");
            traverseDiv.id = "traverse-div";
            traverseDiv.style.width = "136px";
            traverseDiv.style.padding = "10px 0px";

            traverseDiv.appendChild(createPrevLink());
            traverseDiv.appendChild(createNextLink());

            return traverseDiv;

            function createPrevLink(){
                var prevLink = document.createElement("a");
                prevLink.classList.add("advanced-search");
                prevLink.innerHTML = "Prev";
                prevLink.href = "#";
                prevLink.style.width = "25%";
                prevLink.style.marginRight = "25%";
                prevLink.style.display = "inline-block";
                prevLink.style.textAlign = "left";

                prevLink.addEventListener("click", function(e){
                    e.preventDefault();
                    var currentID = parseInt(locationHeaderDetailLink.children[0].innerHTML);
                    traverseAccounts(false, currentID);
                });

                return prevLink;
            }

            function createNextLink(){
                var nextLink = document.createElement("a");
                nextLink.classList.add("advanced-search");
                nextLink.innerHTML = "Next";
                nextLink.href = "#";
                nextLink.style.width = "25%";
                nextLink.style.display = "inline-block";
                nextLink.style.textAlign = "right";

                nextLink.addEventListener("click", function(e){
                    e.preventDefault();
                    var currentID = parseInt(locationHeaderDetailLink.children[0].innerHTML);
                    traverseAccounts(true, currentID);
                });

                return nextLink;
            }

        }

        function traverseAccounts(forward, startID){
            var newID = forward ? startID+1 : startID-1;
            goToAccount(newID);
        }

        function findAccountListener(){
            GM_deleteValue("findAccount");

            GM_addValueChangeListener("findAccount", function(name, old_value, new_value, remote){
                if(!checkLastFocus()) return;

                window.focus();

                var accountInfo = JSON.parse(new_value);

                var accountIdRegEx = /(?<!\d)\d{5,6}(?!\d)/;
                var accountIdRegExMatcher = new RegExp(accountIdRegEx);
                var accountIdMatch = null;
                accountIdMatch = accountIdRegExMatcher.exec(accountInfo.name);

                if(accountIdMatch){
                    console.log("goToAccount: Account="+accountIdMatch[0]);
                    goToAccount(accountIdMatch[0]);
                } else if(accountInfo.name.includes("LEAD")){
                    var leadName = accountInfo.name.replace("LEAD", "").trim();

                    GM_setValue("findLead", JSON.stringify({
                        name: leadName,
                        phone: accountInfo.phone,
                        timeStamp: Date.now()
                    }));

                    window.location.href = "https://app.west.pestpac.com/leads/";
                } else {
                    var phoneNumberMatch = phoneNumberRegExMatcher.exec(accountInfo.phone);

                    if(phoneNumberMatch){
                        console.log("goToAccount: Phone="+phoneNumberMatch[0]);
                        goToAccount(phoneNumberMatch[0]);
                    }
                }

            });
        }
    }

    const ppLocationDetail = () => {
        const ssid = getOldAccount();

        const branch = document.getElementById('Branch').value;

        let oldPlatform = '';

        if(branch === 'Spider Man Natural Pest Control'){
            oldPlatform = 'FieldRoutes';
        } else if( branch === 'Sentry Exterminating Co'){
            oldPlatform = 'ServSuite';
        }

        const goToSSHandler = () => {
            const oldAccount = getOldAccount();

            if(oldPlatform==='ServSuite'){
                GM_setValue('PP_to_SS', {id: oldAccount});
                window.open('https://sprolive.theservicepro.net/user/home.aspx');
            } else if(oldPlatform==='FieldRoutes'){
                console.log(oldAccount);
                GM_setValue('PP_to_PR', {id: oldAccount});
                window.open('https://organicspiderman.fieldroutes.com/customers');
            }
        }

        const phone = document.getElementsByClassName('contact-link-span')[1].getAttribute('data-phonenumber');
        if(phone.length===10){
            document.getElementById('locationHeaderDetailLink').click();
        }


        const goToPestPacAccount = (account) => {
            const oldAccount = getOldAccount();
            if(oldAccount===account.id){
                if(account.addSetup){
                    window.focus();
                    setTimeout(()=>{
                        document.getElementById('recurringServicesContainer').children[0].children[0].children[0].children[1].click();
                        document.getElementsByClassName('pendo-location-recurring-service__add-setup')[0].click();
                    }, 500);
                } else {
                    GM_setValue('oldAccount_to_PP', '');
                    GM_addValueChangeListener('oldAccount_to_PP', function(name, old_value, account, remote){
                        goToPestPacAccount(account);
                    });
                }
            } else {
                window.focus();
                window.location.href = 'https://app.west.pestpac.com/search/default.asp';
            }
        }

        const oldAccountLink = document.createElement('button');
        oldAccountLink.innerHTML = oldPlatform;
        oldAccountLink.style.cursor = 'pointer';
        oldAccountLink.onclick = goToSSHandler;

        const pageHeader = document.getElementById('page-header');
        pageHeader.appendChild(oldAccountLink);

        const oldAccount_to_PP = GM_getValue('oldAccount_to_PP');

        if(oldAccount_to_PP){
            goToPestPacAccount(oldAccount_to_PP);
        } else {
            GM_addValueChangeListener('oldAccount_to_PP', function(name, old_value, account, remote){
                goToPestPacAccount(account);
            });
        }
    }

    const ppLocationEdit = () => {
        const taxCodeInput = document.getElementById('TaxCode');
        taxCodeInput.focus();
        taxCodeInput.value = 'NO TAX';
        taxCodeInput.click();
        taxCodeInput.blur();

        const directionsInput = document.getElementById('Directions');
        if(!directionsInput.value.match(/\*/g)){
            directionsInput.value = "** "+directionsInput.value;
        }

        const phoneInput = document.getElementById('Phone');
        if(phoneInput.value){
            phoneInput.focus();
            phoneInput.blur();
        }

        const altPhoneInput = document.getElementById('AltPhone');
        if(altPhoneInput.value){
            altPhoneInput.focus();
            altPhoneInput.blur();
        }

        const mobileInput = document.getElementById('Mobile');
        if(mobileInput.value){
            mobileInput.focus();
            mobileInput.blur();
        }

        const mobileLink = mobileInput.parentElement.parentElement.children[0];
        mobileLink.innerHTML = '<strong>Mobile</strong>';
        mobileLink.style.cursor = 'pointer';
        mobileLink.onclick = () => {
            const primaryPhone = phoneInput.value;
            console.log(mobileLink);
            mobileInput.value = primaryPhone;
        };

    }

    const ppSearchDefault = () => {

        const goToPPListener = (PPID) => {
            const ssInput = document.getElementsByName('UserDef1')[0];
            ssInput.focus();
            ssInput.value = PPID;
            document.getElementById('butSearch').click();
        }

        const oldAccount = GM_getValue('oldAccount_to_PP');

        if(oldAccount.id){
            goToPPListener(oldAccount.id);
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
            GM_setValue('oldAccount_to_PP', {id: id});
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
                GM_setValue('oldAccount_to_PP','');
                GM_setValue('oldAccount_to_PP', program);
            }

            Array.from(programRow).forEach((row, i) => {
                let program = {};
                if(row.children){
                    program.service = row.children[1].children[0].textContent;
                    program.lastDate = row.children[2].textContent;
                    program.nextDate = row.children[3].textContent;
                    program.amount = row.children[5].textContent;
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
            console.log(program);

            const lastDate = new Date(program.lastDate)
            const nextDate = new Date(program.nextDate);
            const weekday = getWeekday(lastDate);

            const week = getWeek(nextDate ? nextDate : lastDate);
            const month = getMonth(nextDate ? nextDate : lastDate);
            const serviceCode = program.serviceCode ? program.serviceCode : convertService(program.service);
            const schedule = program.schedule ? program.schedule : parseSchedule(serviceCode, month, week, weekday);
            const amount = program.amount;
            let duration = 25;

            if(amount > 175){
                duration = 200;
            } else if(amount > 150){
                duration = 130;
            } else if(amount > 125){
                duration = 115;
            } else if(amount > 100){
                duration = 100;
            } else if(amount > 90){
                duration = 55
            } else if(amount > 80){
                duration = 50
            } else if(amount > 70){
                duration = 40
            } else if(amount > 60){
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
                        value: amount
                    }
                },
                {
                    input: {
                        target: 'StartDate',
                        value: program.addedDate
                    }
                },
                {
                    input: {
                        target: 'Duration',
                        value: duration
                    }
                },
                {
                    input: {
                        target: 'LastGeneratedDate',
                        value: program.lastDate
                    }
                },
                {
                    conditional: program.startMonth <= 1,
                    click: 'Skip1'
                },
                {
                    conditional: program.startMonth <= 2,
                    click: 'Skip2'
                },
                {
                    conditional: program.startMonth <= 3,
                    click: 'Skip3'
                },
                {
                    conditional: program.startMonth <= 4,
                    click: 'Skip4'
                },
                {
                    conditional: program.endMonth >= 9,
                    click: 'Skip9'
                },
                {
                    conditional: program.endMonth >= 10,
                    click: 'Skip10'
                },
                {
                    conditional: program.endMonth >= 11,
                    click: 'Skip11'
                },
                {
                    conditional: program.endMonth >= 12,
                    click: 'Skip12'
                },
                {
                    input: {
                        target: 'Tech1',
                        value: 'JEFFWILSON'
                    }
                },
                {
                    input: {
                        target: 'Schedule',
                        value: schedule
                    }
                },
                {
                    conditional: !program.target,
                    click: 'IncludedPestSpan'
                }
            ]);

        }

        const oldAccount = GM_getValue('oldAccount_to_PP');
        GM_setValue('oldAccount_to_PP','');

        if(oldAccount.addSetup){
            enterSetupDetails(oldAccount.addSetup);
        }

        const addReminderLinks = () => {

            const setTextReminder = () => {
                execute([
                    {
                        click: 'TextNotify1'
                    },
                    {
                        click: 'CallNotify1'
                    },
                    {
                        input: {
                            target: 'NotificationDays1',
                            value: 2
                        }
                    }
                ]);
            }

            const setEmailReminder = () => {
                execute([
                    {
                        click: 'EmailNotify1'
                    },
                    {
                        click: 'CallNotify1'
                    },
                    {
                        input: {
                            target: 'NotificationDays1',
                            value: 2
                        }
                    }
                ]);
            }

            const tblNotificationsDiv = document.getElementById('tblNotifications');

            const emailLink = tblNotificationsDiv.children[1].children[0].children[2];
            emailLink.innerHTML = '<strong>Email</strong>';
            emailLink.style.cursor = 'pointer';
            emailLink.onclick = setEmailReminder;

            const textLink = tblNotificationsDiv.children[1].children[0].children[3];
            textLink.innerHTML = '<strong>Text</strong>';
            textLink.style.cursor = 'pointer';
            textLink.onclick = setTextReminder;
        }

        addReminderLinks();
    }

    const prCustomers = () => {
        const oldAccount = GM_getValue('PP_to_PR');
        const customerSearch = document.getElementById('customerSearch');

        console.log(oldAccount);

        if(oldAccount){
            customerSearch.focus();
            customerSearch.value = oldAccount.id;
            GM_setValue('PP_to_PR', null);
        }

        const recurringServiceForm = document.getElementById('recurringServiceForm');

        const subscriptionPanel = document.getElementById('subscriptionPanel');

        var observer = new MutationObserver(function(mutations){

            mutations.forEach(function(mutation){

                if (!mutation.addedNodes) return

                for (var i = 0; i < mutation.addedNodes.length; i++) {

                    var node = mutation.addedNodes[i];

                    if(node){
                        if(node.children && node.children[0]){
                            if(node.id==='customerWindow'){
                                addPestPacLink();
                            } else if(node.children[0].children && node.children[0].children[1]){
                                if(node.children[0].children[1].id==='subscriptionForm'){
                                    addPestPacDiv();
                                }
                            }
                        }
                    }
                }

            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        const addPestPacLink = () => {
            const pestPacAnchor = document.createElement('a');
            pestPacAnchor.innerHTML = 'PestPac';
            pestPacAnchor.classList.add('ui-tabs-anchor');
            pestPacAnchor.href="#";
            pestPacAnchor.onclick = goToPestPac;
            const pestPacLink = document.createElement('li');
            pestPacLink.appendChild(pestPacAnchor);
            const customerWindow = document.getElementById('customerWindow');
            customerWindow.children[0].children[1].children[0].appendChild(pestPacLink);
        }

        const addPestPacDiv = () => {
            const pestPacDiv = document.createElement('div');
            pestPacDiv.innerHTML = 'Copy to PestPac';
            pestPacDiv.classList.add('callout-item');
            pestPacDiv.onclick = copyToPestPac;
            const subscriptionActionDiv = document.getElementById('subscriptionActionDiv');
            subscriptionActionDiv.children[2].appendChild(pestPacDiv);
        }

        const goToPestPac = () => {
            const id = document.getElementById('ui-id-14').children[0].innerHTML.replace('\[','').replace('\] ','');
            GM_setValue('oldAccount_to_PP', {id});
        }

        const copyToPestPac = () => {
            const id = document.getElementById('ui-id-14').children[0].innerHTML.replace('\[','').replace('\] ','');
            const servicePlan = document.getElementById('addServicePlanForm').children[6].children[0].children[0].children[0].innerHTML.trim();
            const seasonStart = document.getElementsByName('seasonalStart')[0].value;
            const seasonEnd = document.getElementsByName('seasonalEnd')[0].value;
            const startMonth = parseInt(seasonStart.substring(5,7));
            const endMonth = parseInt(seasonEnd.substring(5,7));
            const dateAdded = document.getElementById('dateAdded').value.replaceAll('-','\/');
            const addedDate = dateAdded.substring(5)+ '/' + dateAdded.substring(0,4)
            const lastDate = document.getElementsByClassName('schedule-date')[0].innerHTML;
            const amount = document.getElementsByClassName('collapsedTotalAmount')[2].innerHTML;

            let serviceCode = '';
            let schedule = '';
            let target = '';

            console.log(serviceCode);

            if(servicePlan==='6 Wk Annual Service Agreement'){
                serviceCode = '6-WEEK';
                target = 'ORGANIC';
            } else if(servicePlan==='Monthly Annual Service Agreement'){
                serviceCode = 'PC-MONTHLY';
                target = 'ORGANIC';
            } else if(servicePlan==='Bi Monthly'){
                serviceCode = 'PC-BIMONTHLY';
                target = 'ORGANIC';
                schedule = 'I-BIMO';
            } else if(servicePlan==='Option 2'){
                serviceCode = 'PC-SEMIANNUAL';
                target = 'ORGANIC';
                schedule = 'I-2X YEAR';
            }

            const serviceData = {
                id,
                addSetup: {
                    serviceCode,
                    schedule,
                    target,
                    startMonth,
                    endMonth,
                    addedDate,
                    lastDate,
                    amount
                }
            };

            GM_setValue('oldAccount_to_PP', serviceData);

        }

    }

    initializePestinator();

})();