QUnit.config.autostart = false;

require(["safe/crypto", "safe/util", "safe/model"], function(crypto, util, model) {
    module("safe/crypto");

    test("key generation", function() {
        var keyLength = 256, pwd = "password";

        var key = crypto.genKey(pwd, null, keyLength);

        // Make sure key is the right size
        // equal(key.key.length, keyLength/32);

        var newKey = crypto.genKey(pwd, key.salt, keyLength, key.iter);

        // Using the same password and salt should result in the same key
        equal(key.key, newKey.key);
        equal(key.salt, newKey.salt);

        newKey = crypto.genKey(pwd, null, keyLength);

        // A key generated with new salt should turn out differently.
        notEqual(newKey.key, key.key);
    });

    test("encrypt/decrypt roundtrip", function() {
        var pwd = "password", pt = "Hello World!";
        var key = crypto.genKey(pwd);

        var c = crypto.encrypt(key.key, pt);

        // We should get back a _crypto.container_ object
        ok(crypto.container.isPrototypeOf(c));

        // Encrypting the same value twice with the same key should
        // result in two different cipher texts, since a new iv is randomly
        // generated each time
        var newC = crypto.encrypt(key.key, pt);
        notEqual(newC.ct, c.ct);

        // Decrypted value should be equal to the original value
        var dec = crypto.decrypt(key.key, c);

        equal(dec, pt);
    });

    test("pwdEncrypt/pwdDecrypt roundtrip", function() {
        var pwd = "password", pt = "Hello World!";

        var c = crypto.pwdEncrypt(pwd, pt);
        var pt2 = crypto.pwdDecrypt(pwd, c);

        // Decrypted value should be equal to original value
        equal(pt2, pt);

        // Same plaintext/password pair should not result in the same cypher text
        c2 = crypto.pwdEncrypt(pwd, pt);
        notEqual(c2.ct, c.ct);
    });

    module("safe/util");

    test("insert", function() {
        // Insert single element at the correct position
        var a = util.insert([0, 1, 2, 3, 4, 5], "a", 2);
        deepEqual(a, [0, 1, "a", 2, 3, 4, 5]);

        // Insert mutliple elements at the correct position
        var b = util.insert([0, 1, 2, 3, 4, 5], ["hello", "world"], 3);
        deepEqual(b, [0, 1, 2, "hello", "world", 3, 4, 5]);

        // For negative indexes, count from the end backwards
        var c = util.insert([0, 1, 2, 3, 4, 5], "a", -2);
        deepEqual(c, [0, 1, 2, 3, "a", 4, 5]);

        // Index should default to 0
        var d = util.insert([0, 1, 2, 3, 4, 5], "a");
        deepEqual(d, ["a", 0, 1, 2, 3, 4, 5]);

        // An out-of-range index should result in the value being inserted at the end
        var e = util.insert([0, 1, 2, 3, 4, 5], "a", 9);
        deepEqual(e, [0, 1, 2, 3, 4, 5, "a"]);
    });

    test("remove", function() {
        // Remove single element
        var a = util.remove(["a", "b", "c", "d", "e"], 3);
        deepEqual(a, ["a", "b", "c", "e"]);

        // Remove a range of elements
        var b = util.remove(["a", "b", "c", "d", "e"], 1, 3);
        deepEqual(b, ["a", "e"]);

        // If upper bound is smaller then lower bound, ignore it
        var c = util.remove(["a", "b", "c", "d", "e"], 1, -1);
        deepEqual(c, ["a", "c", "d", "e"]);

        // If upper bound is bigger than the length of the list, remove everything up to the end
        var d = util.remove(["a", "b", "c", "d", "e"], 1, 10);
        deepEqual(d, ["a"]);

        // If lower bound is out-of-range, return a simple copy
        var e = util.remove(["a", "b", "c", "d", "e"], 10);
        deepEqual(e, ["a", "b", "c", "d", "e"]);
    });

    module("safe/model", {
        setup: function() {
            // console.log("*** setup ***");
        },
        teardown: function() {
            // console.log("*** teardown ***");
        }
    });

    test("create new collection", function() {
        var collName = "test";
        // First, make sure that the collection in question does not exist yet
        localStorage.setItem("coll_" + collName, null);

        var coll = Object.create(model.collection);
        coll.name = collName;

        coll.fetch();
        deepEqual(coll.records, []);

        coll.save();
        notEqual(localStorage.getItem("coll_" + collName), null, "There should be something in the localStorage now.");
    });

    test("add record", function() {
        var coll = Object.create(model.collection);
        var record = Object.create(model.record);
        
        coll.add(record);
        equal(coll.records.length, 1);
        equal(coll.records[0], record);
    });

    QUnit.start();
});