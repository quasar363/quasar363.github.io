function check_storage() {
    if (typeof(Storage) === "undefined") {
        return false;
    }
    if (!sessionStorage.basket) {
        sessionStorage.basket = JSON.stringify({});
    }
    if (!sessionStorage.shipping) {
        sessionStorage.shipping = JSON.stringify({});
    }
    if (!sessionStorage.cards) {
        sessionStorage.cards = JSON.stringify([]);
    }
    return true;
}

function redirect(page) {
    location.href = page + ".html";
}

function add_to_basket(product, element) {
    if (!check_storage()) {
        return;
    }

    var basket = JSON.parse(sessionStorage.basket);
    var converted = parseInt(element.value);

    if (isNaN(converted) || converted === 0) {
        return;
    }

    if (basket[product]) {
        basket[product] = +basket[product] + +converted;
    } else {
        basket[product] = converted;
    }

    sessionStorage.basket = JSON.stringify(basket);
    element.value = "";
}

function remove_from_basket(product) {
    if (!check_storage()) {
        return;
    }

    var basket = JSON.parse(sessionStorage.basket);

    if (basket[product]) {
        delete basket[product];
    }

    sessionStorage.basket = JSON.stringify(basket);
}

function swap(element) {
    var inner = element.innerHTML;
    var pieces = inner.split(": ");

    if (pieces[1] == "yes") {
        element.innerHTML = pieces[0] + ": " + "no";
    } else if (pieces[1] == "no") {
        element.innerHTML = pieces[0] + ": " + "any";
    } else {
        element.innerHTML = pieces[0] + ": " + "yes";
    }
}

function format_amount(product, amount) {
    var unit;

    if (product === "c-liquid (5 millilitre)") {
        unit = "bottle";
    } else if (product === "c-liquid (50 millilitre)") {
        unit = "bottle";
    } else if (product === "c-liquid (100 millilitre)") {
        unit = "bottle";
    }

    if (parseInt(amount) > 1) {
        unit += "s";
    }

    return amount + " " + unit;
}

function reduced_price(amount, levels, prices) {
    var rest = amount;
    var final = 0;

    for (var i = levels.length - 1; i >= 0; i--) {
        if (rest >= levels[i]) {
            rest -= levels[i];
            final += levels[i] * prices[i];
            i++;
        }
    }

    return final;
}

function calculate_price(product, amount) {
    if (product === "c-liquid (5 millilitre)") {
        return reduced_price(amount, [1, 2, 7, 10, 20], [15, 14.5, 13.5, 13, 11.5]);
    } else if (product === "c-liquid (50 millilitre)") {
        return reduced_price(amount, [1, 2, 7, 10, 20], [90, 85, 80, 75, 60]);
    } else if (product === "c-liquid (100 millilitre)") {
        return reduced_price(amount, [1, 2, 7, 10, 20], [150, 140, 125, 115, 100]);
    }
}

function update_basket() {
    if (!check_storage()) {
        return;
    }

    var basket = JSON.parse(sessionStorage.basket);
    var content = "";
    var total = 0;

    for (let [name, amount] of Object.entries(basket)) {
        var formatted = format_amount(name, amount);
        var price = calculate_price(name, amount);
        content += "<tr><td>" + name + "</td><td>" + formatted + "</td><td>" + Number(price).toFixed(2) + " euros" + "</td><td><button class='data_button' onclick='remove_from_basket(\"" + name +  "\");update_basket()'>remove</button></td></tr>";
        total = +total + +price;
    }

    document.getElementById('basket_list').innerHTML = content;
    document.getElementById('total').innerHTML = "total: " + Number(total).toFixed(2) + " euros";
}

function update_cards() {
    if (!check_storage()) {
        return;
    }

    var cards = JSON.parse(sessionStorage.cards);
    var content = "";

    for (let [index, code] of Object.entries(cards)) {
        content += "<tr><td>" + code + "</td><td><button class='data_button' onclick='remove_card(\"" + code + "\");update_cards()'>remove</button></td></tr>";
    }

    document.getElementById('cards_list').innerHTML = content;
}

function update_shipping() {
    if (!check_storage()) {
        return;
    }

    var shipping = JSON.parse(sessionStorage.shipping);
    for (let [name, data] of Object.entries(shipping)) {
        document.getElementById(name).value = data;
    }
}

function order() {
    if (!check_storage()) {
        return;
    }

    var shipping = JSON.parse(sessionStorage.shipping);
    var basket = JSON.parse(sessionStorage.basket);
    var content = "";

    if (Object.keys(basket).length <= 0) {
        content += "<li>items</li>";
    }
    if (!shipping.first_name_field || shipping.first_name_field.length <= 0) {
        content += "<li>first name</li>";
    }
    if (!shipping.last_name_field || shipping.last_name_field.length <= 0) {
        content += "<li>last name</li>";
    }
    if (!shipping.country_field || shipping.country_field.length <= 0) {
        content += "<li>country</li>";
    }
    if (!shipping.state_field || shipping.state_field.length <= 0) {
        content += "<li>state / region</li>";
    }
    if (!shipping.city_field || shipping.city_field.length <= 0) {
        content += "<li>city</li>";
    }
    if (!shipping.address_field || shipping.address_field.length <= 0) {
        content += "<li>street + house number</li>";
    }

    if (content.length > 0) {
        document.getElementById('missing_label').innerHTML = "missing:<br><br>" + content;
    } else {
        document.getElementById('missing_label').innerHTML = "";
        redirect("order");
    }
}

function generate(to, salt) {
    var content = "";

    var basket = JSON.parse(sessionStorage.basket);
    for (let [name, amount] of Object.entries(basket)) {
        content += name + " " + amount + "<br>";
    }

    var cards = JSON.parse(sessionStorage.cards);
    for (let [index, code] of Object.entries(cards)) {
        content += code + "<br>";
    }

    var shipping = JSON.parse(sessionStorage.shipping);
    content += shipping.first_name_field + "<br>";
    content += shipping.last_name_field + "<br>";
    content += shipping.country_field + "<br>";
    content += shipping.state_field + "<br>";
    content += shipping.city_field + "<br>";
    content += shipping.address_field + "<br>";

    encode(content, to, salt);
}

function encode(message, to, salt) {
    let messageToChars = message => message.split('').map(c => c.charCodeAt(0))
    let byteHex = n => ("0" + Number(n).toString(16)).substr(-2)
    let applySaltToChar = code => messageToChars(salt).reduce((a,b) => a ^ b, code)

    var encoded = message.split('').map(messageToChars).map(applySaltToChar).map(byteHex).join('');
    document.getElementById(to).innerHTML = encoded;
}

function decode(from, to, salt) {
    let message = document.getElementById(from).value;
    let messageToChars = message => message.split('').map(c => c.charCodeAt(0))
    let saltChars = messageToChars(salt)
    let applySaltToChar = code => messageToChars(salt).reduce((a,b) => a ^ b, code)

    var decoded = message.match(/.{1,2}/g).map(hex => parseInt(hex, 16)).map(applySaltToChar).map(charCode => String.fromCharCode(charCode)).join('');
    document.getElementById(to).innerHTML = decoded;
}

function safe_field(name) {
    if (!check_storage()) {
        return;
    }

    var shipping = JSON.parse(sessionStorage.shipping);
    shipping[name] = document.getElementById(name).value;
    sessionStorage.shipping = JSON.stringify(shipping);
}

function add_card() {
    if (!check_storage()) {
        return;
    }

    var code = document.getElementById("card_field").value;

    if (code.length < 16) {
        return;
    }

    var cards = JSON.parse(sessionStorage.cards);
    cards.push(code);
    sessionStorage.cards = JSON.stringify(cards);

    document.getElementById("card_field").value = "";
    update_cards();
}

function remove_card(code) {
    if (!check_storage()) {
        return;
    }

    var cards = JSON.parse(sessionStorage.cards);
    var index = cards.indexOf(code);
    if (index > -1) {
      cards.splice(index, 1);
    }
    sessionStorage.cards = JSON.stringify(cards);

    update_cards();
}

function copy() {
    const copy_to_clipboard = string => {
        const element = document.createElement('textarea');
        element.value = string;
        element.setAttribute('readonly', '');
        element.style.position = 'absolute'
        element.style.left = '-9999px';
        document.body.appendChild(element);
        element.select();
        document.execCommand('copy');
        document.body.removeChild(element);
        document.getSelection().removeAllRanges();
    };

    var message = document.getElementById("generated_label").innerHTML;
    copy_to_clipboard(message);
}

function done() {
    if (!check_storage()) {
        return;
    }

    sessionStorage.basket = JSON.stringify({});
    sessionStorage.shipping = JSON.stringify({});
    sessionStorage.cards = JSON.stringify([]);

    redirect("index");
}
