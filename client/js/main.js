'use strict';

// Handle link form submission
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

// Handle contact form submission
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

// Get all submitted data
(function(){
    ajax({
        url: '/api/v1/url',
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
            document.getElementById('links').innerHTML = html;
        },
        error: function(xhr, status, err){
            console.log(xhr);
            console.log(status);
            console.log(err);
        }
    });

    ajax({
        url: '/api/v1/vcard',
        method: 'GET',
        dataType: 'json',
        success: function(data){
            var html = '';
            data.forEach(function(item){
                html += `
                    <p>
                        <a href="${ item.apiUrl }" target="_blank" rel="noopener" style="font-family: monospace;">${ item.id }</a><br>
                        <strong>Created:</strong> ${ item.created }<br>
                    </p>
                `;
            });
            document.getElementById('vcards').innerHTML = html;
        },
        error: function(xhr, status, err){
            console.error(status, err);
        }
    });
})();
