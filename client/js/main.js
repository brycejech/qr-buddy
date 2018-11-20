'use strict';

// Generic form handler
(function() {

    const forms = [
        {
            title: 'Email Form',
            selector: '#email-form',
            imgContainerSelector: '.email-img-container'
        },
        {
            title: 'URL Form',
            selector: '#url-form',
            imgContainerSelector: '.url-img-container'
        },
        {
            title: 'vCard Form',
            selector: '#vcard-form',
            imgContainerSelector: '.vcard-img-container'
        },
        {
            title: 'SMS Form',
            selector: '#sms-form',
            imgContainerSelector: '.sms-img-container'
        },
        {
            title: 'Phone Form',
            selector: '#phone-form',
            imgContainerSelector: '.phone-img-container'
        }
    ];

    forms.forEach(function(descriptor){
        const form = document.querySelector(descriptor.selector);

        form.addEventListener('submit', _getSubmitHandler(descriptor));
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
                        console.log('has data-validator');
                        const validator = new RegExp(input.getAttribute('data-validator'));

                        if(!validator.test(value)){
                            console.log('validation failed');
                            // Validation failed
                            hasErrors = true;
                            input.classList.remove('success');
                            input.classList.add('error');
                            input.nextElementSibling.innerText = input.getAttribute('data-error');
                        }
                        else{
                            console.log('validation passed');
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

                        const qrContainer = document.querySelector(formDescriptor.imgContainerSelector);

                        // Clear contents
                        qrContainer.innerHTML = '';

                        // Full-screen link
                        const imgAnchor = document.createElement('a');
                        imgAnchor.innerText = 'View Fullscreen';
                        imgAnchor.setAttribute('target', '_blank');
                        imgAnchor.setAttribute('rel', 'noopener');
                        imgAnchor.href = response.svgUrl;
                        qrContainer.appendChild(imgAnchor);

                        // Display the QR image
                        const img = document.createElement('img');
                        img.src = response.svgUrl;
                        qrContainer.appendChild(img);
                    },
                    error: (xhr, status, err) => {
                        console.error(`Error submitting data to url "${ formDescriptor.title }"`);

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
        (() => {})();
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

            default:
                return el.value;
        }
    }

}());


// Get all submitted data and display it
(function(){

    [
        { url: '/api/v1/url',   containerId: 'links' },
        { url: '/api/v1/vcard', containerId: 'vcards' },
        { url: '/api/v1/email', containerId: 'emails' },
        { url: '/api/v1/sms',   containerId: 'smss'   },
        { url: '/api/v1/phone', containerId: 'phones' }
    ]
    .forEach(endpoint => {
        ajax({
            url: endpoint.url,
            method: 'GET',
            dataType: 'json',
            success: function(data){
                let html = ''
                data.forEach(function(item){
                    html += `
                        <p>
                            <a href="${ item.apiUrl }" target="_blank" rel="noopener" style="font-family: monospace;">${ item.id }</a><br>
                            <strong>Created:</strong> ${ item.created }<br>
                        </p>
                    `;
                });

                const container = document.getElementById(endpoint.containerId)

                if(container){
                    container.innerHTML = html;
                }
                else{
                    console.error('Failed to lookup containerId for ' + endpoint.url + ' route');
                }
            },
            error: function(xhr, status, err){
                console.error('Failed to fetch data for ' + endpoint.url + ' route');
                console.error(status, err);
            }
        });
    });

})();


// Handle pane switching
(function(){
    // Containers
    const paneContainer = document.getElementById('pane-container');

    // Buttons
    const urlPaneBtn   = document.getElementById('url-pane-btn'),
          vCardPaneBtn = document.getElementById('vcard-pane-btn'),
          emailPaneBtn = document.getElementById('email-pane-btn'),
          smsPaneBtn   = document.getElementById('sms-pane-btn'),
          phonePaneBtn = document.getElementById('phone-pane-btn');

    const buttons = [urlPaneBtn, vCardPaneBtn, emailPaneBtn, smsPaneBtn, phonePaneBtn];

    function showPane(e){
        const targetPane = this.getAttribute('data-target');

        if(!targetPane) return;

        Array.from(paneContainer.querySelectorAll('.pane'))
            .forEach( pane => pane.classList.remove('active') );

        const pane = document.querySelector(targetPane);

        if(pane){
            pane.classList.add('active');

            buttons.forEach( btn => btn.classList.remove('active') );

            this.classList.add('active');
        }
    }

    buttons.forEach( btn => btn.addEventListener('click', showPane) );

})();
