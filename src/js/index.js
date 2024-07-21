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
    function sendAlert(title, data) {
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
