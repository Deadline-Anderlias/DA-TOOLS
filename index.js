const { exec } = require('child_process');
const readline = require('readline');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;

// Créez une interface de lecture pour obtenir l'entrée utilisateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Afficher les messages avec les codes d'échappement ANSI
const displayInfo = () => {
    console.log("\x1b[31m██████╗░░█████╗░░░░░░░████████╗░█████╗░\n██╔══██╗██╔══██╗░░░░░░╚══██╔══╝██╔══██╗\n██║░░██║███████║█████╗░░░██║░░░██║░░██║\n██║░░██║██╔══██║╚════╝░░░██║░░░██║░░██║\n██████╔╝██║░░██║░░░░░░░░░██║░░░╚█████╔╝\n╚═════╝░╚═╝░░╚═╝░░░░░░░░░╚═╝░░░░╚════╝░\x1b[0m");
    console.log('\x1b[33mThis Tools made by Deadline Anderlias\x1b[0m');
    console.log('\x1b[33m────────────────────────────────────────────────────────────────────────────────\x1b[0m');
    console.log('\x1b[31m\x1b[1m[ 1 ]\x1b[0m - \x1b[34mAuto create Facebook account\x1b[0m');
    console.log('\x1b[31m\x1b[1m[ 2 ]\x1b[0m - \x1b[34mGet Access Token\x1b[0m\n');
};

// Fonction pour exécuter les scripts en fonction de l'entrée utilisateur
const executeScript = (choice) => {
    if (choice === '1') {
        // Démarrer le processus de création automatique de compte Facebook
        (async () => {
            let count = 1;
            while (true) {
                const mailAccount = await createMailTmAccount();
                if (mailAccount) {
                    await registerFacebookAccount(
                        mailAccount.email,
                        mailAccount.password,
                        mailAccount.firstName,
                        mailAccount.lastName,
                        mailAccount.birthday,
                        count
                    );
                    count++;
                }
                await sleep(3000); // Pause de 3 secondes entre chaque tentative
            }
        })();
    } else if (choice === '2') {
        // Demander les informations pour obtenir le jeton d'accès
        const askForCredentials = () => {
            rl.question('\n\x1b[33m[ ! ] - \x1b[0m\x1b[37mPlease enter your email/phone number: \x1b[0m', (login) => {
                rl.question('\n\x1b[33m[ ! ] - \x1b[0m\x1b[37mPlease enter your password: \x1b[0m', (password) => {
                    getFacebookAccessToken(login, password);
                });
            });
        };

        askForCredentials();
    } else {
        console.log('\x1b[31mInvalide Option. Please enter 1 or 2.\x1b[0m');
    }
};

// Fonction pour obtenir le jeton d'accès Facebook
const getFacebookAccessToken = async (login, password) => {
    const api_key = '882a8490361da98702bf97a021ddc14d';
    const secret = '62f8ce9f74b12f84c123cc23437a4a32';
    const req = {
        api_key: api_key,
        email: login,
        format: 'json',
        locale: 'en_US',
        method: 'auth.login',
        password: password,
        return_ssl_resources: 0,
        v: '1.0',
    };
    const sig = Object.keys(req).sort().map(k => `${k}=${req[k]}`).join('') + secret;
    req.sig = crypto.createHash('md5').update(sig).digest('hex');

    const api_url = 'https://api.facebook.com/restserver.php';
    try {
        const response = await axios.post(api_url, new URLSearchParams(req), {
            headers: { 'User-Agent': '[FBAN/FB4A;FBAV/35.0.0.48.273;FBDM/{density=1.33125,width=800,height=1205};FBLC/fr_FR;FBCR/;FBPN/com.facebook.katana;FBDV/Nexus 7;FBSV/4.1.1;FBBK/0;]' }
        });
        const reg = response.data;
        if (reg.access_token) {
            console.log(`[✓] Jeton d'accès récupéré: ${reg.access_token}`);
            await saveAccessToken(reg.access_token, 'jetons2.json');
            return reg.access_token;
        } else {
            console.error(`\n\x1b[1m\x1b[31m[×] ERROR\x1b[0m: ${reg.error_msg ? reg.error_msg : 'Erreur inconnue'}`);
            return null;
        }
    } catch (error) {
        console.error(`[×] Erreur d'obtention du jeton d'accès: ${error}`);
        return null;
    }
};

// Fonction pour générer une chaîne aléatoire
const genRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Fonction pour obtenir une date aléatoire
const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Fonction pour obtenir un nom aléatoire
const getRandomName = () => {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Laura', 'Robert', 'Emily', 'William', 'Emma', 
                   'Oliver', 'Charlotte', 'James', 'Amelia', 'Benjamin', 'Mia', 'Lucas', 'Isabella', 'Mason', 'Sophia'];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    return {
        firstName: names[Math.floor(Math.random() * names.length)],
        lastName: surnames[Math.floor(Math.random() * surnames.length)],
    };
};

// Fonction pour obtenir les domaines de Mail.tm
const getMailDomains = async () => {
    const url = 'https://api.mail.tm/domains';
    try {
        const response = await axios.get(url);
        return response.data['hydra:member'];
    } catch (error) {
        console.error(`\x1b[31m[×] Erreur E-mail:\x1b[0m ${error}`);
        return null;
    }
};

// Fonction pour créer un compte Mail.tm
const createMailTmAccount = async () => {
    const mailDomains = await getMailDomains();
    if (mailDomains) {
        const domain = mailDomains[Math.floor(Math.random() * mailDomains.length)].domain;
        const username = genRandomString(10);
        const password = genRandomString(12);
        const birthday = getRandomDate(new Date(1976, 0, 1), new Date(2004, 0, 1));
        const { firstName, lastName } = getRandomName();
        const url = 'https://api.mail.tm/accounts';
        const data = { address: `${username}@${domain}`, password: password };
        try {
            const response = await axios.post(url, data, { headers: { 'Content-Type': 'application/json' } });
            if (response.status === 201) {
                return { email: `${username}@${domain}`, password, firstName, lastName, birthday };
            } else {
                console.error(`\x1b[31m[×] Erreur E-mail:\x1b[0m ${response.data}`);
                return null;
            }
        } catch (error) {
            console.error(`\x1b[31m[×] Erreur:\x1b[0m ${error}`);
            return null;
        }
    } else {
        return null;
    }
};

// Fonction pour enregistrer un compte Facebook
const registerFacebookAccount = async (email, password, firstName, lastName, birthday, rank) => {
    const api_key = '882a8490361da98702bf97a021ddc14d';
    const secret = '62f8ce9f74b12f84c123cc23437a4a32';
    const gender = Math.random() < 0.5 ? 'M' : 'F';
    const req = {
        api_key: api_key,
        attempt_login: true,
        birthday: birthday.toISOString().split('T')[0],
        client_country_code: 'FR',
        fb_api_caller_class: 'com.facebook.registration.protocol.RegisterAccountMethod',
        fb_api_req_friendly_name: 'registerAccount',
        firstname: firstName,
        format: 'json',
        gender: gender,
        lastname: lastName,
        email: email,
        locale: 'fr_FR',
        method: 'user.register',
        password: password,
        reg_instance: genRandomString(32),
        return_multiple_errors: true,
    };
    const sig = Object.keys(req).sort().map(k => `${k}=${req[k]}`).join('') + secret;
    const ensig = crypto.createHash('md5').update(sig).digest('hex');
    req.sig = ensig;

    const api_url = 'https://b-api.facebook.com/method/user.register';
    try {
        const response = await axios.post(api_url, new URLSearchParams(req), {
            headers: { 'User-Agent': '[FBAN/FB4A;FBAV/35.0.0.48.273;FBDM/{density=1.33125,width=800,height=1205};FBLC/fr_FR;FBCR/;FBPN/com.facebook.katana;FBDV/Nexus 7;FBSV/4.1.1;FBBK/0;]' }
        });
        const reg = response.data;
        let accessToken = null;
        if (reg.access_token) {
            accessToken = reg.access_token;
        } else if (reg.session_info && reg.session_info.access_token) {
            accessToken = reg.session_info.access_token;
        }

        if (accessToken) {
            console.log(`\n\x1b[37m\x1b[1m[ ${rank} ] \x1b[36mSUCCÈS\x1b[0m\x1b[32m\n`);
            console.log(`\x1b[37m\x1b[1mNom :\x1b[0m\x1b[32m ${lastName}`);
            console.log(`\x1b[37m\x1b[1mPrénom :\x1b[0m\x1b[32m ${firstName}`);
            console.log(`\x1b[37m\x1b[1mEmail :\x1b[0m\x1b[32m ${email}`);
            console.log(`\x1b[37m\x1b[1mMot de passe :\x1b[0m\x1b[32m ${password}`);
            console.log(`\x1b[37m\x1b[1mDate de naissance :\x1b[0m\x1b[32m ${birthday.toISOString().split('T')[0]}`);
            console.log(`\x1b[37m\x1b[1mJeton d'accès :\x1b[0m\x1b[33m ${accessToken}\n`);

            // Ajouter le jeton d'accès au fichier jetons.json
            await saveAccessToken(accessToken, 'jetons.json');

            return accessToken;
        } else {
            console.error(`\x1b[37m\x1b[1m[ ${rank} ] ERREUR \x1b[0m\x1b[31m\n`);
            return null;
        }
    } catch (error) {
        console.error(`\x1b[37m\x1b[1m[ ${rank} ] ERREUR \x1b[0m\x1b[31m`);
        console.error(`\x1b[31m[×] Erreur d'inscription:\x1b[0m ${error}\n`);
        return null;
    }
};

// Fonction pour sauvegarder les jetons d'accès dans un fichier spécifié
const saveAccessToken = async (token, filePath) => {
    try {
        // Lire le contenu actuel du fichier spécifié
        let tokens = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            tokens = JSON.parse(data);
        } catch (error) {
            // Si le fichier n'existe pas ou a une erreur de lecture, on crée un tableau vide
            if (error.code !== 'ENOENT') {
                console.error(`\x1b[31m[×] Erreur de lecture du fichier:\x1b[0m ${error}`);
                return;
            }
        }

        // Ajouter le nouveau jeton à la liste
        tokens.push(token);

        // Écrire la liste mise à jour dans le fichier
        await fs.writeFile(filePath, JSON.stringify(tokens, null, 2));
    } catch (error) {
        console.error(`\x1b[31m[×] Erreur de sauvegarde du fichier:\x1b[0m ${error}`);
    }
};

// Fonction de pause
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Afficher les informations et demander à l'utilisateur de faire un choix
displayInfo();
rl.question('\n\x1b[1m\x1b[37mPlease choice : \x1b[0m', (answer) => {
    executeScript(answer.trim());
});