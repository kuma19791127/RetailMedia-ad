// Check if the user has a valid session token (cleared on restart or cache clear)
        if (!sessionStorage.getItem('retailMediaAuth')) {
            window.location.replace('index.html');
        }