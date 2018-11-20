'use strict';

// Handle url form submit
(function(){
    var linkSubmit  = document.querySelector('.link-submit'),
        linkInput   = document.querySelector('.link-input'),
        qrContainer = document.querySelector('.url-img-container');

    linkSubmit.addEventListener('click', function(e){
        e.preventDefault();

        ajax({
            url: '/api/v1/url',
            method: 'PUT',
            dataType: 'json',
            data: JSON.stringify({ url: linkInput.value }),
            success: function(data){

                // Clear contents
                qrContainer.innerHTML = '';

                // Full-screen link
                var imgAnchor = document.createElement('a');
                imgAnchor.innerText = 'View Fullscreen';
                imgAnchor.setAttribute('target', '_blank');
                imgAnchor.setAttribute('rel', 'noopener');
                imgAnchor.href = data.svgUrl;
                qrContainer.appendChild(imgAnchor);

                // Display the QR image
                var img = document.createElement('img');
                img.src = data.svgUrl;
                qrContainer.appendChild(img);

                // Add a link to the submitted URL
                var urlAnchor = document.createElement('a');
                urlAnchor.innerText = data.data;
                urlAnchor.setAttribute('target', '_blank');
                urlAnchor.setAttribute('rel', 'noopener');
                urlAnchor.href = data.data;
                qrContainer.appendChild(urlAnchor);
            },
            error: function(xhr, status, err){
                console.error(status, err);
            }
        });

    });
})();

// Handle contact form submit
(function(){
    var vCardForm   = document.getElementById('vcard-form'),
        submitBtn   = vCardForm.querySelector('.vCard-submit'),
        qrContainer = document.querySelector('.vcard-img-container');

    submitBtn.addEventListener('click', function(e){
        e.preventDefault();

        ajax({
            url: '/api/v1/vcard',
            method: 'PUT',
            dataType: 'json',
            data: JSON.stringify(getFormData()),
            success: function(data){

                // Clear contents
                qrContainer.innerHTML = '';

                // Full-screen link
                var imgAnchor = document.createElement('a');
                imgAnchor.innerText = 'View Fullscreen';
                imgAnchor.setAttribute('target', '_blank');
                imgAnchor.setAttribute('rel', 'noopener');
                imgAnchor.href = data.svgUrl;
                qrContainer.appendChild(imgAnchor);

                // Display QR image
                var img = document.createElement('img');
                img.src = data.svgUrl;
                qrContainer.appendChild(img);
            },
            error: function(xhr, status, err){
                console.error(status, err);
            }
        });
    });

    var inputs = [
        // Name
        'firstName', 'lastName','namePrefix','nameSuffix','nickname',
        // Org
        'organization','title','website',
        // Emails
        'email','workEmail',
        // Phones
        'cellPhone','workPhone','homePhone','pager',
        // Faxes
        'homeFax','workFax',
        // Dates
        'birthday','anniversary',
        //Notes
        'notes'
    ];

    function getFormData(){
        var data = {}

        inputs.forEach(function(name){
            var el = vCardForm.querySelector('.' + name);

            data[name] = el.value;
        });

        return data;
    }
})();

// Handle email submit
(function(){
    var emailForm   = document.getElementById('email-form'),
        emailSubmit = emailForm.querySelector('.email-submit'),
        qrContainer = document.querySelector('.email-img-container');

    var inputClasses = ['email', 'subject', 'body'];

    function formSubmit(e){
        e.preventDefault();

        var data = {};

        inputClasses.forEach(function(cls){
            var el = emailForm.querySelector('.' + cls);

            if(el && el.value){
                data[cls] = el.value
            }
        });

        ajax({
            url: '/api/v1/email',
            method: 'PUT',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data){

                // Clear contents
                qrContainer.innerHTML = '';

                // Full-screen link
                var imgAnchor = document.createElement('a');
                imgAnchor.innerText = 'View Fullscreen';
                imgAnchor.setAttribute('target', '_blank');
                imgAnchor.setAttribute('rel', 'noopener');
                imgAnchor.href = data.svgUrl;
                qrContainer.appendChild(imgAnchor);

                // Display the QR image
                var img = document.createElement('img');
                img.src = data.svgUrl;
                qrContainer.appendChild(img);
            },
            error: function(xhr, status, err){
                console.error(status, err);
            }
        })
    }

    emailSubmit.addEventListener('click', formSubmit);
})();

// Handle SMS submit
(function(){

    var smsForm     = document.getElementById('sms-form-container'),
        smsSubmit   = smsForm.querySelector('.sms-submit'),
        qrContainer = document.querySelector('.sms-img-container');

    function formSubmit(e){
        e.preventDefault();

        var data = {},
            inputClasses = ['number', 'body'];


        inputClasses.forEach(function(cls){
            var el = document.querySelector('.' + cls);

            if(el && el.value){
                data[cls] = el.value;
            }
        });

        ajax({
            url: '/api/v1/sms',
            method: 'PUT',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data){
                // Clear contents
                qrContainer.innerHTML = '';

                // Full-screen link
                var imgAnchor = document.createElement('a');
                imgAnchor.innerText = 'View Fullscreen';
                imgAnchor.setAttribute('target', '_blank');
                imgAnchor.setAttribute('rel', 'noopener');
                imgAnchor.href = data.svgUrl;
                qrContainer.appendChild(imgAnchor);

                // Display the QR image
                var img = document.createElement('img');
                img.src = data.svgUrl;
                qrContainer.appendChild(img);
            },
            error: function(xhr, status, err){
                console.error(status, err);
            }
        });
    }

    smsSubmit.addEventListener('click', formSubmit);

})();


// Get all submitted data and display it
(function(){

    [
        { url: '/api/v1/url',   containerId: 'links' },
        { url: '/api/v1/vcard', containerId: 'vcards' },
        { url: '/api/v1/email', containerId: 'emails' },
        { url: '/api/v1/sms',   containerId: 'smss'   },
        { url: '/api/v1/phone', containerId: 'phones' }
    ]
    .forEach(function(endpoint){
        ajax({
            url: endpoint.url,
            method: 'GET',
            dataType: 'json',
            success: function(data){
                var html = ''
                data.forEach(function(item){
                    html += `
                        <p>
                            <a href="${ item.apiUrl }" target="_blank" rel="noopener" style="font-family: monospace;">${ item.id }</a><br>
                            <strong>Created:</strong> ${ item.created }<br>
                        </p>
                    `;
                });
                var container = document.getElementById(endpoint.containerId)

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
    var paneContainer = document.getElementById('pane-container');

    // Buttons
    var urlPaneBtn   = document.getElementById('url-pane-btn'),
        vCardPaneBtn = document.getElementById('vcard-pane-btn'),
        emailPaneBtn = document.getElementById('email-pane-btn'),
        smsPaneBtn   = document.getElementById('sms-pane-btn'),
        phonePaneBtn = document.getElementById('phone-pane-btn');

    var buttons = [ urlPaneBtn, vCardPaneBtn, emailPaneBtn, smsPaneBtn, phonePaneBtn ];

    function showPane(e){
        var targetPane = this.getAttribute('data-target');

        if(!targetPane) return;

        ([].slice.call(paneContainer.querySelectorAll('.pane')))
            .forEach(function(pane){
                pane.classList.remove('active');
            });

        var pane = document.querySelector(targetPane);

        if(pane){
            pane.classList.add('active');

            buttons.forEach(function(button){
                button.classList.remove('active');
            });

            this.classList.add('active');
        }
    }

    buttons.forEach(function(btn){
        btn.addEventListener('click', showPane);
    });

})();
