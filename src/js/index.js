let alertTimeout;
$(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) $('#dark-theme').removeClass('hidden');
    else $('#light-theme').removeClass('hidden');
    $('button[aria-controls="mobile-menu"]').on('click', () => {
        var menu = $('#mobile-menu');
        var menuButton = $(this);
        var isExpanded = menuButton.attr('aria-expanded') === 'true';
        menuButton.attr('aria-expanded', !isExpanded);
        menu.toggleClass('hidden');
        menuButton.find('svg').toggleClass('hidden');
    });
    $('#theme-toggle').on('click', () => {
        $(document.documentElement).toggleClass('mocha');
        $('#light-theme').toggleClass('hidden');
        $('#dark-theme').toggleClass('hidden');
        localStorage.theme = $(document.documentElement).hasClass('mocha') ? 'dark' : 'light';
    });
    $('code').on('click', function () {
        clearTimeout(alertTimeout);
        const copied = $(this).text();
        navigator.clipboard
            .writeText(copied)
            .then(() => {
                sendAlert('Copied to clipboard: ', copied);
            })
            .catch((err) => {
                console.error('Error while copying text to clipboard: ', err);
            });
    });
    $('#website-open').on('click', function () {
        sendAlert('Why are you clicking this? ', 'You literally have it open.');
    });
    $('#contact-form').on('submit', function (event) {
        event.preventDefault();
        const email = $('#email').val();
        const subject = $('#subject').val();
        const message = $('#message').val();
        $('#email').val('');
        $('#subject').val('');
        $('#message').val('');
        fetch('https://discord.com/api/webhooks/1264592141490061373/zndiiua5ZsL1d-c1koZriWbGIeWKnWK1s5i8DOkti3KD7HlfEmT70mh1pmY0m1BgaLwU?wait=true', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `**Email:** \`${email}\`\n**Subject:** \`${subject}\`\n**Message:**\n\`\`\`${message}\`\`\``
            })
        })
            .then(() => {
                sendAlert('Submitted! ', `You'll get a response at ${email} within 7 working days.`);
            })
            .catch(() => {
                sendAlert('Error! ', 'Something went wrong. Try again later.');
            });
    });
    function sendAlert(title, data) {
        clearTimeout(alertTimeout);
        $('#alert-title').text(title);
        $('#alert-data').text(data);
        $('#alert').removeClass('hidden');
        $('#alert').removeClass('opacity-0');
        $('#alert').addClass('opacity-100');
        alertTimeout = setTimeout(() => {
            $('#alert').removeClass('opacity-100');
            $('#alert').addClass('opacity-0');
            $('#alert').on('transitionend', () => {
                $('#alert').addClass('hidden');
                clearTimeout(alertTimeout);
            });
        }, 2000);
    }
});
