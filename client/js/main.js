'use strict';

const app = (function() {

    // Localhost storage mechanism
    const storage = (function() {
        let data = window.localStorage.userData || "[]";

        try{
            data = JSON.parse(data);
        }
        catch(e){
            window.localStorage.userData = "[]";
            data = [];
        }

        function add(item){
            data.push(item);
            window.localStorage.userData = JSON.stringify(data);
        }

        function get(id){
            return data.filter(item => item.id === id)[0];
        }

        function getAll(){ return data.reverse() } // Most recent items first

        return { add, get, getAll }
    }());

    const typeMap = {
        url:   'URL',
        vcard: 'vCard',
        email: 'Email',
        sms:   'SMS',
        phone: 'Phone',
        geo:   'Geo',
        wifi:  'WiFi',
        text:  'Text'
    }

    // DOM Elements
    const myCodesBtn      = document.getElementById('my-codes-btn'),
          myCodes         = document.getElementById('my-codes'),
          sidebar         = document.getElementById('code-panel'),
          sidebarCloseBtn = document.getElementById('panel-close');

    const paneContainer = document.getElementById('pane-container');

    const btnContainer = document.getElementById('form-select'),
          paneBtns     = Array.from(btnContainer.querySelectorAll('.pane-btn'));


    function addItem(item){
        // Add new item to storage
        storage.add(item);

        // Add to sidebar
        myCodes.innerHTML = _formatItemHTML(item) + myCodes.innerHTML;

        window.modal(`#_${ item.id }`);
        // setTimeout(showSidebar, 750);
    }


    function _formatItemHTML(item){

        // item must have dataType property
        if(!item.hasOwnProperty('dataType')) return;

        const data = item.dataAttachment;

        let description;
        switch(item.dataType){
            case 'url':
                description = `Link to <a href="${ data.url }" target="_blank" rel="noopener">${ data.url }</a>`;
                break;
            case 'vcard':
                description = `vCard for ${ data.firstName } ${ data.lastName}`;
                break;
            case 'email':
                description = `Send email to ${ data.address }`;
                break;
            case 'sms':
                description = `Send SMS to ${ data.number }`;
                break;
            case 'phone':
                description = `Call ${ data.number }`;
                break;
            case 'geo':
                description = `Coordinates ${ data.lat }, ${ data.lon }`;
                break;
            case 'wifi':
                description = `Network credentials for ${ data.ssid }`;
                break;
            case 'text':
                description = `Encoded text: ${ data.string }`;
                break;
            default:
                description = 'Type unknown';
                break;
        }

        return `
            <div class="col-xs-6 col-sm-12">
                <div class="data-item px-1 py-1 rounded" data-toggle="modal" data-target="#_${ item.id }">
                    <span class="td-ul full-width text-center mb-1">
                        QR Type: ${ typeMap[item.dataType] }
                    </span>
                    <img src="${ item.svgUrl }" class="qr-img" alt="QR image for ${ data.url }">
                </div>
            </div>

            <!-- Item Modal ${ item.id } -->
            <div id="_${ item.id }" class="modal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-close">&times;</div>
                        <h3 class="text-center">QR Description</h3>
                        <table>
                            <tr>
                                <th>Type:</th>
                                <td>${ typeMap[item.dataType] }</td>
                            </tr>
                            <tr>
                                <th>Created:</th>
                                <td>${ item.created }</td>
                            </tr>
                            <tr>
                                <th>Description:</th>
                                <td>
                                    ${ description }
                                </td>
                            </tr>
                            <tr>
                                <th>API URL:</th>
                                <td>
                                    <a href="${ item.apiUrl }" target="_blank" rel="noopener">View Page</a>
                                </td>
                            </tr>
                            <tr>
                                <th>Image URL:</th>
                                <td>
                                    <a href="${ item.svgUrl }" target="_blank" rel="noopener">View Image</a>
                                </td>
                            </tr>
                        </table>
                        <div class="qr-container">
                            <img class="qr-img" src="${ item.svgUrl }">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    function showPane(btn){
        const targetPane = btn.getAttribute('data-target');

        if(!targetPane) return;

        Array.from(paneContainer.querySelectorAll('.pane'))
            .forEach( pane => pane.classList.remove('active') );

        const pane = document.querySelector(targetPane);

        if(pane){
            pane.classList.add('active');

            paneBtns.forEach( btn => btn.classList.remove('active') );

            btn.classList.add('active');
        }
    }

    function showSidebar(){ sidebar.className = 'active' }
    function closeSidebar(){ sidebar.className = '' }
    function toggleSidebar(){
        sidebar.className ? closeSidebar() : showSidebar();
    }


    // UI Initialization
    (function() {

        // Populate the "My Codes" sidebar
        myCodes.innerHTML = storage.getAll().map(_formatItemHTML).join('');

        // Hide/show sidebar on button click
        myCodesBtn.addEventListener('click', toggleSidebar);

        // Hide sidebar on click outside of sidebar (e.g. document)
        document.addEventListener('click', e => {
            if(sidebar.className !== 'active') return;
            if(e.target === myCodesBtn) return;
            if(e.target === sidebarCloseBtn) return closeSidebar();

            let el = e.target;

            while(el && el.parentNode !== document){
                if(el === sidebar) return;
                el = el.parentNode;
            }
            closeSidebar();
        });

    }());


    // Public App Methods
    const publicAPI = { addItem, showPane }

    return publicAPI;
}());

// Generic form handler
(function() {

    const forms = [
        {
            title: 'Email Form',
            selector: '#email-form'
        },
        {
            title: 'URL Form',
            selector: '#url-form'
        },
        {
            title: 'vCard Form',
            selector: '#vcard-form'
        },
        {
            title: 'SMS Form',
            selector: '#sms-form'
        },
        {
            title: 'Phone Form',
            selector: '#phone-form'
        },
        {
            title: 'Geo Form',
            selector: '#geo-form'
        },
        {
            title: 'WiFi Form',
            selector: '#wifi-form'
        },
        {
            title: 'Text Form',
            selector: '#text-form'
        }
    ];

    forms.forEach(descriptor => {
        const form = document.querySelector(descriptor.selector);

        form && (form.addEventListener('submit', _getSubmitHandler(descriptor)))
    });

    // Keeps a reference to the original form descriptor
    function _getSubmitHandler(formDescriptor){

        return submitHandler;

        function submitHandler(e){
            e.preventDefault();

            let hasErrors = false;

            const inputs = Array.from(this.querySelectorAll('input, textarea, select')),
                  data   = {};

            inputs
                .filter(input => input.getAttribute('type') !== 'submit')
                .forEach(input => {

                    const value = _getInputValue(input),
                          name  = input.getAttribute('name');

                    // Input value must be validated
                    if(!!input.getAttribute('data-validator')){
                        const validator = new RegExp(input.getAttribute('data-validator'));

                        if(!validator.test(value)){
                            // Validation failed
                            hasErrors = true;
                            input.classList.remove('success');
                            input.classList.add('error');
                            input.nextElementSibling.innerText = input.getAttribute('data-error');
                        }
                        else{
                            // Validation passed
                            input.classList.remove('error');
                            input.classList.add('success');
                            input.nextElementSibling.innerText = '';

                            data[name] = value;
                        }
                    }

                    if(value){
                        data[name] = value;
                    }
                });

            if(!hasErrors){
                const url    = this.getAttribute('action'),
                      method = this.getAttribute('method');

                if(!(url && method)){
                    return console.error(`Failed to lookup url or method for form "${ form.title }"`);
                }

                ajax({
                    url:       url,
                    method:    method,
                    dataType: 'json',
                    data:      JSON.stringify(data),
                    success: (response) => {
                        app.addItem(response);
                    },
                    error: (xhr, status, err) => {
                        console.error(`Error submitting data for "${ formDescriptor.title }"`);
                        console.table(JSON.parse(xhr.response));
                    }
                });
            }
        }
    }

    // Allows use of HTMLElement.matches() back to IE9
    if (!Element.prototype.matches) {
    	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    // Find parent element by selector or callback
    function _parents(el, cb){
        const str = cb;
        typeof cb === 'string' && (cb = (el) => el.matches(str));

        if( cb(el) ) return el;

        // Traverse up the DOM
        while(el && el.parentNode !== document){
            el = el.parentNode;
            if( cb(el) ) return el;
        }
        return undefined;
    }

    // Get value for various input types
    function _getInputValue(el){
        const type = el.getAttribute('type') ? el.getAttribute('type').toLowerCase() : null,
              name = el.getAttribute('name');

        let parentForm;

        switch(type){
            case 'text':
            case 'password':
            case 'submit':
            case 'reset':
            case 'button':
            case 'email':
            case 'number':
            case 'search':
            case 'color':
            case 'date':
            case 'month':
            case 'range':
            case 'tel':
            case 'time':
            case 'url':
            case 'week':
                return el.value;

            case 'radio':
                parentForm = _parents(el, 'form');

                if(!parentForm) return;

                const checked = parentForm.querySelector(`input[name="${ name }"]:checked`);

                return checked ? checked.value : '';

            case 'checkbox':
                parentForm = _parents(el, 'form');

                if(!parentForm) return;

                const checkboxes = Array.from(parentForm.querySelectorAll(`input[name="${ name }"]`)),
                      values     = [];

                checkboxes.forEach(ck => {
                    if(ck.checked) values.push(ck.value);
                });

                return values.join(', ');

            case 'select':
                return el.value || el.options[el.selectedIndex].value

            default:
                return el.value;
        }
    }

}());
