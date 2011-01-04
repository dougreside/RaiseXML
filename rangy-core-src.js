/**
 * Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Copyright 2010, Tim Down
 * Licensed under the MIT license.
 * Version: 0.1.76
 * Build date: 22 August 2010
 */
var rangy = (function() {


    var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";

    var domRangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer", "START_TO_START", "START_TO_END", "END_TO_START", "END_TO_END"];

    var domRangeMethods = ["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
        "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents",
        "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach"];

    var textRangeProperties = ["boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text"];

    // Subset of TextRange's full set of methods that we're interested in
    var textRangeMethods = ["collapse", "compareEndPoints", "duplicate", "getBookmark", "moveToBookmark",
        "moveToElementText", "parentElement", "pasteHTML", "select", "setEndPoint"];

    /*----------------------------------------------------------------------------------------------------------------*/

    // Trio of functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(o, p) {
        var t = typeof o[p];
        return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
    }

    function isHostObject(o, p) {
        return !!(typeof o[p] == OBJECT && o[p]);
    }

    function isHostProperty(o, p) {
        return typeof o[p] != UNDEFINED;
    }

    // Creates a convenience function to save verbose repeated calls to tests functions
    function createMultiplePropertyTest(testFunc) {
        return function(o, props) {
            var i = props.length;
            while (i--) {
                if (!testFunc(o, props[i])) {
                    return false;
                }
            }
            return true;
        };
    }

    // Next trio of functions are a convenience to save verbose repeated calls to previous two functions
    var areHostMethods = createMultiplePropertyTest(isHostMethod);
    var areHostObjects = createMultiplePropertyTest(isHostObject);
    var areHostProperties = createMultiplePropertyTest(isHostProperty);

    var api = {
        initialized: false,
        supported: false,

        util: {
            isHostMethod: isHostMethod,
            isHostObject: isHostObject,
            isHostProperty: isHostProperty,
            areHostMethods: areHostMethods,
            areHostObjects: areHostObjects,
            areHostProperties: areHostProperties
        },
        features: {
        },
        modules: {

        }
    };

    function fail(reason) {
        alert("Rangy not supported in your browser. Reason: " + reason);
        api.initialized = true;
        api.supported = false;
    }

    api.fail = fail;

    // Initialization
    function init() {
        var testRange;
        var implementsDomRange = false, implementsTextRange = false;

        // First, perform basic feature tests

        if (isHostMethod(document, "createRange")) {
            testRange = document.createRange();
            if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                implementsDomRange = true;
            }
            testRange.detach();
        }

        if (isHostObject(document, "body") && isHostMethod(document.body, "createTextRange")) {
            testRange = document.body.createTextRange();
            if (areHostMethods(testRange, textRangeMethods) && areHostProperties(testRange, textRangeProperties)) {
                implementsTextRange = true;
            }
        }

        if (!implementsDomRange && !implementsTextRange) {
            fail("Neither Range nor TextRange are implemented");
        }

        api.initialized = true;
        api.features = {
            implementsDomRange: implementsDomRange,
            implementsTextRange: implementsTextRange
        };

        // Notify listeners
        for (var i = 0, len = initListeners.length; i < len; ++i) {
            try {
                initListeners[i](api);
            } catch (ex) {

            }
        }
    }

    // Allow external scripts to initialize this library in case it's loaded after the document has loaded
    api.init = init;

    var initListeners = [];
    api.addInitListener = function(listener) {
        initListeners.push(listener);
    };

    function Module(name) {
        this.name = name;
        this.initialized = false;
        this.supported = false;
    }

    Module.prototype.fail = function(reason) {
        this.initialized = true;
        this.supported = false;

        throw new Error("Module '" + this.name + "' failed to load: " + reason);
    };

    api.createModule = function(name, initFunc) {
        var module = new Module(name);
        api.modules[name] = module;

        initListeners.push(function(api) {
            initFunc(api, module);
            module.initialized = true;
            module.supported = true;
        });
    };

    api.requireModules = function(modules) {
        for (var i = 0, len = modules.length, module, moduleName; i < len; ++i) {
            moduleName = modules[i];
            module = api.modules[moduleName];
            if (!module || !(module instanceof Module)) {
                throw new Error("Module '" + moduleName + "' not found");
            }
            if (!module.supported) {
                throw new Error("Module '" + moduleName + "' not supported");
            }
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wait for document to load before running tests

    var docReady = false;
    var oldOnload;

    var loadHandler = function(e) {

        if (!docReady) {
            docReady = true;
            if (!api.initialized) {
                init();
            }
        }
    };

    // Test whether we have window and document objects that we will need
    if (typeof window == UNDEFINED) {
        fail("No window found");
        return;
    }
    if (typeof document == UNDEFINED) {
        fail("No document found");
        return;
    }

    if (isHostMethod(document, "addEventListener")) {
        document.addEventListener("DOMContentLoaded", loadHandler, false);
    }

    // Add a fallback in case the DOMContentLoaded event isn't supported
    if (isHostMethod(window, "addEventListener")) {
        window.addEventListener("load", loadHandler, false);
    } else if (isHostMethod(window, "attachEvent")) {
        window.attachEvent("onload", loadHandler);
    } else {
        oldOnload = window.onload;
        window.onload = function(evt) {
            loadHandler(evt);
            if (oldOnload) {
                oldOnload.call(window, evt);
            }
        };
    }

    return api;
})();
rangy.createModule("DomUtil", function(api, module) {


    // Perform feature tests
    if (!api.util.areHostMethods(document, ["createDocumentFragment", "createElement", "createTextNode"])) {
        module.fail("document missing a Node creation method");
    }

    var el = document.createElement("div");
    if (!api.util.areHostMethods(el, ["insertBefore", "appendChild", "cloneNode"] ||
            !api.util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]))) {
        module.fail("Incomplete Element implementation");
    }

    var textNode = document.createTextNode("test");
    if (!api.util.areHostMethods(textNode, ["splitText", "deleteData", "insertData", "appendData", "cloneNode"] ||
            !api.util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]) ||
            !api.util.areHostProperties(textNode, ["data"]))) {
        module.fail("Incomplete Text Node implementation");
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Removed use of indexOf because of a bizarre bug in Opera that is thrown in one of the Acid3 tests. Haven't been
    // able to replicate it outside of the test. The bug is that indexOf return -1 when called on an Array that contains
    // just the document as a single element and the value searched for is the document.
    var arrayContains = /*Array.prototype.indexOf ?
        function(arr, val) {
            return arr.indexOf(val) > -1;
        }:*/

        function(arr, val) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === val) {
                    return true;
                }
            }
            return false;
        };

    function getNodeIndex(node) {
        var i = 0;
        while( (node = node.previousSibling) ) {
            i++;
        }
        return i;
    }

    function getCommonAncestor(node1, node2) {
        var ancestors = [], n;
        for (n = node1; n; n = n.parentNode) {
            ancestors.push(n);
        }

        for (n = node2; n; n = n.parentNode) {
            if (arrayContains(ancestors, n)) {
                return n;
            }
        }

        return null;
    }

    function isAncestorOf(ancestor, descendant, selfIsAncestor) {
        var n = selfIsAncestor ? descendant : descendant.parentNode;
        while (n) {
            if (n === ancestor) {
                return true;
            } else {
                n = n.parentNode;
            }
        }
        return false;
    }

    function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
        var p, n = selfIsAncestor ? node : node.parentNode;
        while (n) {
            p = n.parentNode;
            if (p === ancestor) {
                return n;
            }
            n = p;
        }
        return null;
    }

    function isCharacterDataNode(node) {
        var t = node.nodeType;
        return t == 3 || t == 4 || t == 8 ; // Text, CDataSection or Comment
    }

    function insertAfter(node, precedingNode) {
        var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
        if (nextNode) {
            parent.insertBefore(node, nextNode);
        } else {
            parent.appendChild(node);
        }
        return node;
    }

    function splitDataNode(node, index) {
        var newNode;
        if (node.nodeType == 3) {
            newNode = node.splitText(index);
        } else {
            newNode = node.cloneNode();
            newNode.deleteData(0, index);
            node.deleteData(0, node.length - index);
            insertAfter(newNode, node);
        }
        return newNode;
    }

    function getDocument(node) {
        if (node.nodeType == 9) {
            return node;
        } else if (typeof node.ownerDocument != "undefined") {
            return node.ownerDocument;
        } else if (typeof node.document != "undefined") {
            return node.document;
        } else if (node.parentNode) {
            return getDocument(node.parentNode);
        } else {
            throw new Error("getDocument: no document found for node");
        }
    }

    function comparePoints(nodeA, offsetA, nodeB, offsetB) {
        // See http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Comparing
        var nodeC, root, childA, childB, n;
        if (nodeA == nodeB) {

            // Case 1: nodes are the same
            return offsetA === offsetB ? 0 : (offsetA < offsetB) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) ) {

            // Case 2: node C (container B or an ancestor) is a child node of A
            return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) ) {

            // Case 3: node C (container A or an ancestor) is a child node of B
            return getNodeIndex(nodeC) < offsetB  ? -1 : 1;
        } else {

            // Case 4: containers are siblings or descendants of siblings
            root = getCommonAncestor(nodeA, nodeB);
            childA = (nodeA === root) ? root : getClosestAncestorIn(nodeA, root, true);
            childB = (nodeB === root) ? root : getClosestAncestorIn(nodeB, root, true);

            if (childA === childB) {
                // This shouldn't be possible

                throw new Error("comparePoints got to case 4 and childA and childB are the same!");
            } else {
                n = root.firstChild;
                while (n) {
                    if (n === childA) {
                        return -1;
                    } else if (n === childB) {
                        return 1;
                    }
                    n = n.nextSibling;
                }
                throw new Error("Should not be here!");
            }
        }
    }

    function NodeIterator(root) {
        this.root = root;
        this._next = root;
    }

    NodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            var n = this._current = this._next;
            var child, next;
            if (this._current) {
                child = n.firstChild;
                if (child) {
                    this._next = child;
                } else {
                    next = null;
                    while ((n !== this.root) && !(next = n.nextSibling)) {
                        n = n.parentNode;
                    }
                    this._next = next;
                }
            }
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.root = null;
        }
    };


    function createIterator(root) {
        return new NodeIterator(root);
    }


    function DomPosition(node, offset) {
        this.node = node;
        this.offset = offset;
    }

    DomPosition.prototype = {
        equals: function(pos) {
            return this.node === pos.node & this.offset == pos.offset;
        }/*,

        isStartOfElementContent: function() {
            var isCharacterData = isCharacterDataNode(this.node);
            var el = isCharacterData ? this.node.parentNode : this.node;
            return (el && el.nodeType == 1 && (isCharacterData ?
            if (isCharacterDataNode(this.node) && !this.node.previousSibling && this.node.parentNode)
        }*/
    };

    var DOMExceptionCodes = {
        INDEX_SIZE_ERR: 1,
        HIERARCHY_REQUEST_ERR: 3,
        WRONG_DOCUMENT_ERR: 4,
        NO_MODIFICATION_ALLOWED_ERR: 7,
        NOT_FOUND_ERR: 8,
        NOT_SUPPORTED_ERR: 9,
        INVALID_STATE_ERR: 11
    };

    function DOMException(codeName) {
        this.code = DOMExceptionCodes[codeName];
        this.codeName = codeName;
        this.message = "DOMException: " + this.codeName;
    }

    DOMException.prototype = DOMExceptionCodes;

    DOMException.prototype.toString = function() {
        return this.message;
    };


    api.dom = {
        arrayContains: arrayContains,
        getNodeIndex: getNodeIndex,
        getCommonAncestor: getCommonAncestor,
        isAncestorOf: isAncestorOf,
        getClosestAncestorIn: getClosestAncestorIn,
        isCharacterDataNode: isCharacterDataNode,
        insertAfter: insertAfter,
        splitDataNode: splitDataNode,
        getDocument: getDocument,
        comparePoints: comparePoints,
        createIterator: createIterator,
        DomPosition: DomPosition,
        DOMException: DOMException
    };
});rangy.createModule("DomRange", function(api, module) {
    api.requireModules( ["DomUtil"] );


    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DOMException = dom.DOMException;

    /*----------------------------------------------------------------------------------------------------------------*/

    // RangeIterator code indebted to IERange by Tim Ryan (http://github.com/timcameronryan/IERange)

    function RangeIterator(range, clonePartiallySelectedTextNodes) {
        this.range = range;
        this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;



        if (!range.collapsed) {
            this.sc = range.startContainer;
            this.so = range.startOffset;
            this.ec = range.endContainer;
            this.eo = range.endOffset;
            var root = range.commonAncestorContainer;

            if (this.sc === this.ec && dom.isCharacterDataNode(this.sc)) {
                this.isSingleCharacterDataNode = true;
                this._first = this._last = this._next = this.sc;
            } else {
                this._first = this._next = (this.sc === root && !dom.isCharacterDataNode(this.sc)) ?
                    this.sc.childNodes[this.so] : dom.getClosestAncestorIn(this.sc, root, true);
                this._last = (this.ec === root && !dom.isCharacterDataNode(this.ec)) ?
                    this.ec.childNodes[this.eo - 1] : dom.getClosestAncestorIn(this.ec, root, true);
            }

        }
    }

    RangeIterator.prototype = {
        _current: null,
        _next: null,
        _first: null,
        _last: null,
        isSingleCharacterDataNode: false,

        reset: function() {
            this._current = null;
            this._next = this._first;
        },

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            // Move to next node
            var current = this._current = this._next;
            if (current) {
                this._next = (current !== this._last) ? current.nextSibling : null;

                // Check for partially selected text nodes
                if (dom.isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                    if (current === this.ec) {
                        (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                    }
                    if (this._current === this.sc) {
                        (current = current.cloneNode(true)).deleteData(0, this.so);
                    }
                }
            }

            return current;
        },

        remove: function() {
            var current = this._current, start, end;

            if (dom.isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                start = (current === this.sc) ? this.so : 0;
                end = (current === this.ec) ? this.eo : current.length;
                if (start != end) {
                    current.deleteData(start, end - start);
                }
            } else {
                if (current.parentNode) {
                    current.parentNode.removeChild(current);
                } else {

                }
            }
        },

        // Checks if the current node is partially selected
        isPartiallySelectedSubtree: function() {
            var current = this._current;
            return isNonTextPartiallySelected(current, this.range);
        },

        getSubtreeIterator: function() {
            var subRange;
            if (this.isSingleCharacterDataNode) {
                subRange = this.range.cloneRange();
                subRange.collapse();
            } else {
                subRange = new Range(getRangeDocument(this.range));
                var current = this._current;
                var startContainer = current, startOffset = 0, endContainer = current, endOffset = getEndOffset(current);

                if (dom.isAncestorOf(current, this.sc, true)) {
                    startContainer = this.sc;
                    startOffset = this.so;
                }
                if (dom.isAncestorOf(current, this.ec, true)) {
                    endContainer = this.ec;
                    endOffset = this.eo;
                }

                updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
            }
            return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
        },

        detach: function(detachRange) {
            if (detachRange) {
                this.range.detach();
            }
            this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Exceptions
    var RangeExceptionCodes = {
        BAD_BOUNDARYPOINTS_ERR: 1,
        INVALID_NODE_TYPE_ERR: 2
    };

    function RangeException(codeName) {
        this.code = RangeExceptionCodes[codeName];
        this.codeName = codeName;
        this.message = "RangeException: " + this.codeName;
    }

    RangeException.prototype = RangeExceptionCodes;

    RangeException.prototype.toString = function() {
        return this.message;
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    function nodeToString(node) {
        if (!node) { return "No node"; }
        return dom.isCharacterDataNode(node) ? '"' + node.data + '"' : node.nodeName;
    }

    function getRangeDocument(range) {
        return dom.getDocument(range.startContainer);
    }

    function dispatchEvent(range, type, args) {
        var listeners = range._listeners[type];
        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; ++i) {
                listeners[i].call(range, {target: range, args: args});
            }
        }
    }

    function getBoundaryBeforeNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node));
    }

    function getBoundaryAfterNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node) + 1);
    }

    function getEndOffset(node) {
        return dom.isCharacterDataNode(node) ? node.length : (node.childNodes ? node.childNodes.length : 0);
    }

    function insertNodeAtPosition(node, n, o) {
        if (dom.isCharacterDataNode(n)) {
            if (o == n.length) {
                n.parentNode.appendChild(node);
            } else {
                n.parentNode.insertBefore(node, o == 0 ? n : dom.splitDataNode(n, o));
            }
        } else if (o >= n.childNodes.length) {
            n.appendChild(node);
        } else {
            n.insertBefore(node, n.childNodes[o]);
        }
        return node;
    }

    function cloneSubtree(iterator) {
        var partiallySelected;
        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
            partiallySelected = iterator.isPartiallySelectedSubtree();

            node = node.cloneNode(!partiallySelected);
            if (partiallySelected) {
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(cloneSubtree(subIterator));
                subIterator.detach(true);
            }

            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function iterateSubtree(rangeIterator, func, iteratorState) {
        var it, n;
        iteratorState = iteratorState || { stop: false };
        for (var node, subRangeIterator; node = rangeIterator.next(); ) {
            //log.debug("iterateSubtree, partially selected: " + rangeIterator.isPartiallySelectedSubtree(), nodeToString(node));
            if (rangeIterator.isPartiallySelectedSubtree()) {
                // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of the
                // node selected by the Range.
                if (func(node) === false) {
                    iteratorState.stop = true;
                    return;
                } else {
                    subRangeIterator = rangeIterator.getSubtreeIterator();
                    iterateSubtree(subRangeIterator, func, iteratorState);
                    subRangeIterator.detach(true);
                    if (iteratorState.stop) {
                        return;
                    }
                }
            } else {
                // The whole node is selected, so we can use efficient DOM iteration to iterate over the node and its
                // descendant
                it = dom.createIterator(node);
                while ( (n = it.next()) ) {
                    if (func(n) === false) {
                        iteratorState.stop = true;
                        return;
                    }
                }
            }
        }
    }

    function deleteSubtree(iterator) {
        var subIterator;
        while (iterator.next()) {
            if (iterator.isPartiallySelectedSubtree()) {
                subIterator = iterator.getSubtreeIterator();
                deleteSubtree(subIterator);
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
        }
    }

    function extractSubtree(iterator) {

        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {


            if (iterator.isPartiallySelectedSubtree()) {
                node = node.cloneNode(false);
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(extractSubtree(subIterator));
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function getNodesInRange(range, nodeTypes, filter) {
        //log.info("getNodesInRange, " + nodeTypes.join(","));
        var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
        var filterExists = !!filter;
        if (filterNodeTypes) {
            regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
        }

        var nodes = [];
        iterateSubtree(new RangeIterator(range, false), function(node) {
            if ((!filterNodeTypes || regex.test(node.nodeType)) && (!filterExists || filter(node))) {
                nodes.push(node);
            }
        });
        return nodes;
    }

    // Currently iterates through all nodes in the range on creation until I think of a decent way to do it
    // TODO: Look into making this a proper iterator, not requiring preloading everything first
    function RangeNodeIterator(range, nodeTypes, filter) {
        this.nodes = getNodesInRange(range, nodeTypes, filter);
        this._next = this.nodes[0];
        this._pointer = 0;
    }

    RangeNodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            this._current = this._next;
            this._next = this.nodes[ ++this._pointer ];
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.nodes = null;
        }
    };

    function isNonTextPartiallySelected(node, range) {
        return (node.nodeType != 3) &&
               (dom.isAncestorOf(node, range.startContainer, true) || dom.isAncestorOf(node, range.endContainer, true));
    }

    var beforeAfterNodeTypes = [1, 3, 4, 5, 7, 8, 10];
    var rootContainerNodeTypes = [2, 9, 11];
    var readonlyNodeTypes = [5, 6, 10, 12];
    var insertableNodeTypes = [1, 3, 4, 5, 7, 8, 10, 11];
    var surroundNodeTypes = [1, 3, 4, 5, 7, 8];

    function createAncestorFinder(nodeTypes) {
        return function(node, selfIsAncestor) {
            var t, n = selfIsAncestor ? node : node.parentNode;
            while (n) {
                t = n.nodeType;
                if (dom.arrayContains(nodeTypes, t)) {
                    return n;
                }
                n = n.parentNode;
            }
            return null;
        };
    }

    function getRootContainer(node) {
        var parent;
        while ( (parent = node.parentNode) ) {
            node = parent;
        }
        return node;
    }

    var getDocumentOrFragmentContainer = createAncestorFinder( [9, 11] );
    var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
    var getDocTypeNotationEntityAncestor = createAncestorFinder( [6, 10, 12] );

    function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
        if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertNotDetached(range) {
        if (!range.startContainer) {
            throw new DOMException("INVALID_STATE_ERR");
        }
    }


    function assertValidNodeType(node, invalidTypes) {
        if (!dom.arrayContains(invalidTypes, node.nodeType)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertValidOffset(node, offset) {
        if (offset < 0 || offset > (dom.isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
            throw new DOMException("INDEX_SIZE_ERR");
        }
    }

    function assertSameDocumentOrFragment(node1, node2) {
        if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    function assertNodeNotReadOnly(node) {
        if (getReadonlyAncestor(node, true)) {
            throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
        }
    }

    function assertNode(node, codeName) {
        if (!node) {
            throw new DOMException(codeName);
        }
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    var rangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
    var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;

    function copyComparisonConstantsToObject(obj) {
        obj.START_TO_START = s2s;
        obj.START_TO_END = s2e;
        obj.END_TO_END = e2e;
        obj.END_TO_START = e2s;

        obj.NODE_BEFORE = n_b;
        obj.NODE_AFTER = n_a;
        obj.NODE_BEFORE_AND_AFTER = n_b_a;
        obj.NODE_INSIDE = n_i;
    }

    function copyComparisonConstants(constructor) {
        copyComparisonConstantsToObject(constructor);
        copyComparisonConstantsToObject(constructor.prototype);
    }

    function createPrototypeRange(constructor, boundaryUpdater, detacher) {
        function createBeforeAfterNodeSetter(isBefore, isStart) {
            return function(node) {
                assertNotDetached(this);
                assertValidNodeType(node, beforeAfterNodeTypes);
                assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);

                var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
            };
        }

        function setRangeStart(range, node, offset) {
            var ec = range.endContainer, eo = range.endOffset;
            if (node !== range.startContainer || offset !== this.startOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(ec) || dom.comparePoints(node, offset, ec, eo) == 1) {
                    ec = node;
                    eo = offset;
                }
                boundaryUpdater(range, node, offset, ec, eo);
            }
        }

        function setRangeEnd(range, node, offset) {
            var sc = range.startContainer, so = range.startOffset;
            if (node !== range.endContainer || offset !== this.endOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(sc) || dom.comparePoints(node, offset, sc, so) == -1) {
                    sc = node;
                    so = offset;
                }
                boundaryUpdater(range, sc, so, node, offset);
            }
        }

        function createRangeContentRemover(remover) {
            return function() {
                assertNotDetached(this);

                var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;

                var iterator = new RangeIterator(this, true);

                // Work out where to position the range after content removal
                var node, boundary;
                if (sc !== root) {
                    node = dom.getClosestAncestorIn(sc, root, true);
                    boundary = getBoundaryAfterNode(node);
                    sc = boundary.node;
                    so = boundary.offset;
                }

                // Check none of the range is read-only
                iterateSubtree(iterator, assertNodeNotReadOnly);

                iterator.reset();

                // Remove the content
                var returnValue = remover(iterator);
                iterator.detach();

                // Move to the new position
                boundaryUpdater(this, sc, so, sc, so);

                return returnValue;
            };
        }

        constructor.prototype = {
            attachListener: function(type, listener) {
                this._listeners[type].push(listener);
            },

            setStart: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStart(this, node, offset);
            },

            setEnd: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeEnd(this, node, offset);
            },

            setStartBefore: createBeforeAfterNodeSetter(true, true),
            setStartAfter: createBeforeAfterNodeSetter(false, true),
            setEndBefore: createBeforeAfterNodeSetter(true, false),
            setEndAfter: createBeforeAfterNodeSetter(false, false),

            collapse: function(isStart) {
                assertNotDetached(this);
                if (isStart) {
                    boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                } else {
                    boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                }
            },

            selectNodeContents: function(node) {
                // This doesn't seem well specified: the spec talks only about selecting the node's contents, which
                // could be taken to mean only its children. However, browsers implement this the same as selectNode for
                // text nodes, so I shall do likewise
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);

                boundaryUpdater(this, node, 0, node, getEndOffset(node));
            },

            selectNode: function(node) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, false);
                assertValidNodeType(node, beforeAfterNodeTypes);

                var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
            },

            compareBoundaryPoints: function(how, range) {
                assertNotDetached(this);
                assertSameDocumentOrFragment(this.startContainer, range.startContainer);

                var nodeA, offsetA, nodeB, offsetB;
                var prefixA = (how == e2s || how == s2s) ? "start" : "end";
                var prefixB = (how == s2e || how == s2s) ? "start" : "end";
                nodeA = this[prefixA + "Container"];
                offsetA = this[prefixA + "Offset"];
                nodeB = range[prefixB + "Container"];
                offsetB = range[prefixB + "Offset"];
                return dom.comparePoints(nodeA, offsetA, nodeB, offsetB);
            },

            insertNode: function(node) {
                assertNotDetached(this);
                assertValidNodeType(node, insertableNodeTypes);
                assertNodeNotReadOnly(this.startContainer);

                if (dom.isAncestorOf(node, this.startContainer, true)) {
                    throw new DOMException("HIERARCHY_REQUEST_ERR");
                }

                // No check for whether the container of the start of the Range is of a type that does not allow
                // children of the type of node: the browser's DOM implementation should do this for us when we attempt
                // to add the node

                insertNodeAtPosition(node, this.startContainer, this.startOffset);
                this.setStartBefore(node);
            },

            cloneContents: function() {
                assertNotDetached(this);

                var clone, frag;
                if (this.collapsed) {
                    return getRangeDocument(this).createDocumentFragment();
                } else {
                    if (this.startContainer === this.endContainer && dom.isCharacterDataNode(this.startContainer)) {
                        clone = this.startContainer.cloneNode(true);
                        clone.data = clone.data.slice(this.startOffset, this.endOffset);
                        frag = getRangeDocument(this).createDocumentFragment();
                        frag.appendChild(clone);
                        return frag;
                    } else {
                        var iterator = new RangeIterator(this, true);
                        clone = cloneSubtree(iterator);
                        iterator.detach();
                    }
                    return clone;
                }
            },

            extractContents: createRangeContentRemover(extractSubtree),

            deleteContents: createRangeContentRemover(deleteSubtree),

            surroundContents: function(node) {
                assertNotDetached(this);
                assertNodeNotReadOnly(this.startContainer);
                assertNodeNotReadOnly(this.endContainer);
                assertValidNodeType(node, surroundNodeTypes);

                // Check if the contents can be surrounded. Specifically, this means whether the range partially selects no
                // non-text nodes.
                var iterator = new RangeIterator(this, true);
                var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                        (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                iterator.detach();
                if (boundariesInvalid) {
                    throw new RangeException("BAD_BOUNDARYPOINTS_ERR");
                }

                // Extract the contents
                var content = this.extractContents();

                // Clear the children of the node
                if (node.hasChildNodes()) {
                    while (node.lastChild) {
                        node.removeChild(node.lastChild);
                    }
                }

                // Insert the new node and add the extracted contents
                insertNodeAtPosition(node, this.startContainer, this.startOffset);
                node.appendChild(content);

                this.selectNode(node);
            },

            cloneRange: function() {
                assertNotDetached(this);
                var range = new Range(getRangeDocument(this));
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = this[prop];
                }
                return range;
            },

            detach: function() {
                detacher(this);
            },

            toString: function() {
                assertNotDetached(this);
                var sc = this.startContainer;
                if (sc === this.endContainer && dom.isCharacterDataNode(sc)) {
                    return (sc.nodeType == 3 || sc.nodeType == 4) ? sc.data.slice(this.startOffset, this.endOffset) : "";
                } else {
                    var textBits = [], iterator = new RangeIterator(this, true);

                    iterateSubtree(iterator, function(node) {
                        // Accept only text or CDATA nodes, not comments

                        if (node.nodeType == 2) {

                        }
                        if (node.nodeType == 3 || node.nodeType == 4) {
                            textBits.push(node.data);
                        }
                    });
                    iterator.detach();
                    return textBits.join("");
                }
            },

            // The methods below are all non-standard. The following batch were introduced by Mozilla but have since
            // been removed from Mozilla.

            compareNode: function(node) {
                var parent = node.parentNode;
                var nodeIndex = dom.getNodeIndex(node);

                if (!parent) {
                    throw new DOMException("NOT_FOUND_ERR");
                }

                var startComparison = this.comparePoint(parent, nodeIndex),
                    endComparison = this.comparePoint(parent, nodeIndex + 1);

                if (startComparison < 0) { // Node starts before
                    return (endComparison > 0) ? n_b_a : n_b;
                } else {
                    return (endComparison > 0) ? n_a : n_i;
                }
            },

            comparePoint: function(node, offset) {
                assertNotDetached(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                if (dom.comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                    return -1;
                } else if (dom.comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                    return 1;
                }
                return 0;
            },

            createContextualFragment: function(html) {
                assertNotDetached(this);
                var doc = getRangeDocument(this);
                var container = doc.createElement("div");

                // The next line is obviously non-standard but will work in all recent browsers
                container.innerHTML = html;

                var frag = doc.createDocumentFragment(), n;

                while ( (n = container.firstChild) ) {
                    frag.appendChild(n);
                }

                return frag;
            },

            intersectsNode: function(node) {
                assertNotDetached(this);
                assertNode(node, "NOT_FOUND_ERR");
                if (dom.getDocument(node) !== getRangeDocument(this)) {
                    return false;
                }

                var parent = node.parentNode, offset = dom.getNodeIndex(node);
                assertNode(parent, "NOT_FOUND_ERR");

                var startComparison = dom.comparePoints(parent, offset, this.startContainer, this.startOffset),
                    endComparison = dom.comparePoints(parent, offset + 1, this.endContainer, this.endOffset);

                return !((startComparison < 0 && endComparison < 0) || (startComparison > 0 && endComparison > 0));
            },

            isPointInRange: function(node, offset) {
                assertNotDetached(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                return (dom.comparePoints(node, offset, this.startContainer, this.startOffset) >= 0) &&
                       (dom.comparePoints(node, offset, this.endContainer, this.endOffset) <= 0);
            },

            // The methods below are non-standard and invented by me.

            // Sharing a boundary start-to-end or end-to-start does not count as intersection.
            intersectsRange: function(range) {
                assertNotDetached(this);

                if (getRangeDocument(range) != getRangeDocument(this)) {
                    throw new DOMException("WRONG_DOCUMENT_ERR");
                }

                return dom.comparePoints(this.startContainer, this.startOffset, range.endContainer, range.endOffset) < 0 &&
                       dom.comparePoints(this.endContainer, this.endOffset, range.startContainer, range.startOffset) > 0;
            },

            containsNode: function(node) {
                var parent = node.parentNode;
                var nodeIndex = dom.getNodeIndex(node);

                if (!parent) {
                    throw new DOMException("NOT_FOUND_ERR");
                }
                //console.log("start: " + this.comparePoint(parent, nodeIndex) + ", end: " + this.comparePoint(parent, nodeIndex + 1));

                return this.comparePoint(parent, nodeIndex) >= 0 && this.comparePoint(parent, nodeIndex + 1) <= 0;
            },

            containsNodeContents: function(node) {
                return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, getEndOffset(node)) <= 0;
            },

            splitBoundaries: function() {

                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
                var startEndSame = (sc === ec);
                assertNotDetached(this);

                if (dom.isCharacterDataNode(ec) && eo < ec.length) {
                    dom.splitDataNode(ec, eo);

                }

                if (dom.isCharacterDataNode(sc) && so > 0) {
                    sc = dom.splitDataNode(sc, so);
                    if (startEndSame) {
                        eo -= so;
                        ec = sc;
                    }
                    so = 0;

                }
                boundaryUpdater(this, sc, so, ec, eo);
            },

            normalizeBoundaries: function() {
                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
                var sibling, startEndSame = (sc === ec);
                assertNotDetached(this);

                var startNode = dom.isCharacterDataNode(sc) ? sc : sc.childNodes[so];
                var endNode = dom.isCharacterDataNode(ec) ? ec : (eo ? ec.childNodes[eo - 1] : null);

                if (endNode && dom.isCharacterDataNode(endNode)) {
                    sibling = endNode.nextSibling;
                    if (sibling && dom.isCharacterDataNode(sibling)) {
                        ec = endNode;
                        eo = endNode.length;
                        ec.appendData(sibling.data);
                        sibling.parentNode.removeChild(sibling);
                    }
                }

                if (startNode && dom.isCharacterDataNode(startNode)) {
                    sibling = startNode.previousSibling;
                    if (sibling && dom.isCharacterDataNode(sibling)) {
                        sc = startNode;
                        sc.insertData(0, sibling.data);
                        so = sibling.length;
                        sibling.parentNode.removeChild(sibling);
                        if (startEndSame) {
                            eo += so;
                            ec = sc;
                        }
                    }
                }
                boundaryUpdater(this, sc, so, ec, eo);
            },

            createNodeIterator: function(nodeTypes, filter) {
                return new RangeNodeIterator(this, nodeTypes, filter);
            },

            getNodes: function(nodeTypes, filter) {
                return getNodesInRange(this, nodeTypes, filter);
            }
        };

        copyComparisonConstants(constructor);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Updates commonAncestorContainer and collapsed after boundary change
    function updateCollapsedAndCommonAncestor(range) {
        range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
        range.commonAncestorContainer = range.collapsed ?
            range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
    }

    function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
        var startMoved = (range.startContainer !== startContainer || range.startOffset !== startOffset);
        var endMoved = (range.endContainer !== endContainer || range.endOffset !== endOffset);

        range.startContainer = startContainer;
        range.startOffset = startOffset;
        range.endContainer = endContainer;
        range.endOffset = endOffset;

        updateCollapsedAndCommonAncestor(range);
        dispatchEvent(range, "boundarychange", {startMoved: startMoved, endMoved: endMoved});
    }

    function detach(range) {
        assertNotDetached(range);
        range.startContainer = range.startOffset = range.endContainer = range.endOffset = null;
        range.collapsed = range.commonAncestorContainer = null;
        dispatchEvent(range, "detach", null);
        range._listeners = null;
    }

    function Range(doc) {
        this.startContainer = doc;
        this.startOffset = 0;
        this.endContainer = doc;
        this.endOffset = 0;
        this._listeners = {
            boundarychange: [],
            detach: []
        };
        updateCollapsedAndCommonAncestor(this);
    }

    createPrototypeRange(Range, updateBoundaries, detach);

/*
    function() {
        function createGetter(propName) {
            return function() {
                if (!this.startContainer) {
                    throw new DOMException("INVALID_STATE_ERR");
                }
                return this["_" + propName];
            }
        }

        function setter() {
            throw new Error("This property is read-only");
        }


        var i = rangeProperties.length;
        if (typeof Object.defineProperty == "function") {
            // ECMAScript 5
            while (i--) {
                Object.defineProperty(Range.prototype, rangeProperties[i], {
                    get: createGetter(rangeProperties[i])
                });
            }
        } else if (Range.prototype.__defineGetter__ && Range.prototype.__defineSetter__) {
            while (i--) {
                Range.prototype.__defineGetter__(rangeProperties[i], createGetter(rangeProperties[i]));
                Range.prototype.__defineSetter__(rangeProperties[i], setter);
            }
        }
    }
*/

    Range.fromRange = function(r) {
        var range = new Range(getRangeDocument(r));
        updateBoundaries(range, r.startContainer, r.startOffset, r.endContainer, r.endOffset);
        return range;
    };

    Range.rangeProperties = rangeProperties;
    Range.RangeIterator = RangeIterator;
    Range.DOMException = DOMException;
    Range.RangeException = RangeException;
    Range.copyComparisonConstants = copyComparisonConstants;
    Range.createPrototypeRange = createPrototypeRange;

    Range.util = {
        getRangeDocument: getRangeDocument,
        nodeToString: nodeToString,
        getEndOffset: getEndOffset,
        rangesEqual: function(r1, r2) {
            return r1.startContainer === r2.startContainer &&
                   r1.startOffset === r2.startOffset &&
                   r1.endContainer === r2.endContainer &&
                   r1.endOffset === r2.endOffset;
        }
    };

    rangy.DomRange = Range;
});rangy.createModule("WrappedRange", function(api, module) {
    api.requireModules( ["DomRange"] );

    var WrappedRange;
    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DomRange = rangy.DomRange;
    var rangeUtil = DomRange.util;



    /*----------------------------------------------------------------------------------------------------------------*/

    function BoundaryResult(position, cleanUpFunc, alteredDom) {
        this.position = position;
        this.cleanUpFunc = cleanUpFunc;
        this.alteredDom = alteredDom;
    }

    BoundaryResult.prototype.cleanUp = function() {
        if (this.cleanUpFunc) {
            this.cleanUpFunc();
        }
    };

    // Gets the boundary of a TextRange expressed as a node and an offset within that node. This method is an improved
    // version of code found in Tim Cameron Ryan's IERange (http://code.google.com/p/ierange/), fixing problems that
    // library has with line breaks in preformatted text, optimizations and other bugs
    function getTextRangeBoundaryPosition(textRange, isStart) {
        var workingRange = textRange.duplicate();
        //log.debug("getTextRangeBoundaryPosition. Uncollapsed textrange parent is " + workingRange.parentElement().nodeName);
        var wholeRangeContainerElement = workingRange.parentElement();
        workingRange.collapse(isStart);
        //log.debug("getTextRangeBoundaryPosition. Collapsed textrange parent is " + workingRange.parentElement().nodeName);
        var containerElement = workingRange.parentElement();

        // Sometimes collapsing a TextRange that's at the start of a text node can move it into the previous node, so
        // check for that
        if (!dom.isAncestorOf(wholeRangeContainerElement, containerElement, true)) {
            containerElement = wholeRangeContainerElement;

        }



        // Deal with nodes that cannot "contain rich HTML markup". In practice, this means form inputs, images and
        // similar. See http://msdn.microsoft.com/en-us/library/aa703950%28VS.85%29.aspx
        if (!containerElement.canHaveHTML) {
            return new BoundaryResult(
                    new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement)), null, false);
        }

        var workingNode = dom.getDocument(containerElement).createElement("span");
        var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
        var previousNode, nextNode, boundaryPosition, boundaryNode, tempRange, normalizedRangeText, cleanUpFunc = null;
        var alteredDom = false;

        // Move the working range through the container's children, starting at
        // the end and working backwards, until the working range reaches or goes
        // past the boundary we're interested in
        do {
            containerElement.insertBefore(workingNode, workingNode.previousSibling);
            workingRange.moveToElementText(workingNode);
        } while ( (comparison = workingRange.compareEndPoints(workingComparisonType, textRange)) > 0 &&
                workingNode.previousSibling);

        // We've now reached or gone past the boundary of the text range we're interested in
        // so have identified the node we want
        boundaryNode = workingNode.nextSibling;
        //log.info("boundaryNode: " + boundaryNode.nodeName + ":" + boundaryNode.nodeValue);

        if (comparison == -1 && boundaryNode) {
            // This must be a data node (text, comment, cdata) since we've overshot. The working range is collapsed at
            // the start of the node containing the text range's boundary, so we move the end of the working range to
            // the boundary point and measure the length of its text to get the boundary's offset within the node
            workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);


            // Ensure offsets are relative to the character data node's text. To do this, and to ensure trailing line
            // breaks are handled correctly, we use the text property of the TextRange to insert a character and split
            // the node in two after the inserted character. This is only
            normalizedRangeText = workingRange.text;

            if (/[\r\n]/.test(boundaryNode.data)) {
                // TODO: Try and stop this clobbering the selection
                // Insert a character. This is a little destructive but we can restore the node afterwards
                tempRange = workingRange.duplicate();
                tempRange.collapse(false);

                // The following line splits the character data node in two and appends a space to the end of the first
                // node. We can use this to our advantage to obtain the text we need to get an offset within the node
                tempRange.text = " ";
                normalizedRangeText = boundaryNode.data.slice(0, -1);
                alteredDom = true;

                // Now we create a function to be called later that glues the text nodes back together and removes the
                // inserted space character
                cleanUpFunc = function() {
                    nextNode = boundaryNode.nextSibling;
                    boundaryNode.data = boundaryNode.data.slice(0, -1) + nextNode.data;
                    nextNode.parentNode.removeChild(nextNode);
                    textRange.collapse();
                };
            }
            boundaryPosition = new DomPosition(boundaryNode, normalizedRangeText.length);
        } else {
            // We've hit the boundary exactly, so this must be an element


            // If the boundary immediately follows a character data node and this is the end boundary, we should favour
            // a position within that, and likewise for a start boundary preceding a character data node
            previousNode = !isStart && workingNode.previousSibling;
            nextNode = isStart && workingNode.nextSibling;
            if (nextNode && dom.isCharacterDataNode(nextNode)) {
                boundaryPosition = new DomPosition(nextNode, 0);
            } else if (previousNode && dom.isCharacterDataNode(previousNode)) {
                boundaryPosition = new DomPosition(previousNode, previousNode.length);
            } else {
                boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
            }
        }

        // Clean up
        workingNode.parentNode.removeChild(workingNode);



        return new BoundaryResult(boundaryPosition, cleanUpFunc, alteredDom);
    }

    // Returns a TextRange representing the boundary of a TextRange expressed as a node and an offset within that node.
    // This method is an optimized version of code found in Tim Cameron Ryan's IERange
    // (http://code.google.com/p/ierange/)
    function createBoundaryTextRange(boundaryPosition, isStart) {
        var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
        var doc = dom.getDocument(boundaryPosition.node);
        var workingNode, childNodes, workingRange = doc.body.createTextRange();
        var isAtStartOfElementContent = false, isAtEndOfElementContent = false;
        var nodeIsDataNode = dom.isCharacterDataNode(boundaryPosition.node);

        // There is a shortcut we can take that prevents the need to insert anything into the DOM if the boundary is at
        // either end of the contents of an element, which is to use TextRange's moveToElementText method

        if (nodeIsDataNode) {
            boundaryNode = boundaryPosition.node;
            boundaryParent = boundaryNode.parentNode;

            // Check if the boundary is at the start of end of the contents of an element
            if (boundaryParent.nodeType == 1) {
                if (boundaryOffset == 0 && !boundaryNode.previousSibling) {
                    isAtStartOfElementContent = true;
                } else if (boundaryOffset == boundaryNode.length && !boundaryNode.nextSibling) {
                    isAtEndOfElementContent = true;
                }
            }
        } else {
            childNodes = boundaryPosition.node.childNodes;

            // Check if the boundary is at the start of end of the contents of an element
            if (boundaryPosition.node.nodeType == 1) {
                if (boundaryOffset == 0) {
                    isAtStartOfElementContent = true;
                } else if (boundaryOffset == childNodes.length) {
                    isAtEndOfElementContent = true;
                }
            }

            boundaryNode = (boundaryOffset < childNodes.length) ? childNodes[boundaryOffset] : null;
            boundaryParent = boundaryPosition.node;
        }

        // Check if we can just use moveToElementText
        if (isAtStartOfElementContent || isAtEndOfElementContent) {

            workingRange.moveToElementText(boundaryParent);
            workingRange.collapse(isAtStartOfElementContent);
        } else {
            // Position the range immediately before the node containing the boundary
            workingNode = doc.createElement("span");

            // insertBefore is supposed to work like appendChild if the second parameter is null. However, a bug report
            // for IERange suggests that it can crash the browser: http://code.google.com/p/ierange/issues/detail?id=12
            if (boundaryNode) {
                boundaryParent.insertBefore(workingNode, boundaryNode);
            } else {
                boundaryParent.appendChild(workingNode);
            }

            workingRange.moveToElementText(workingNode);

            // Clean up
            boundaryParent.removeChild(workingNode);

            // Move the working range to the text offset, if required
            if (nodeIsDataNode) {
                workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
            }
        }

        return workingRange;
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    if (api.features.implementsDomRange) {
        // This is a wrapper around the browser's native DOM Range. It has two aims:
        // - Provide workarounds for specific browser bugs
        // - provide convenient extensions, as found in Rangy's DomRange

        (function() {
            var rangeProto;
            var rangeProperties = DomRange.rangeProperties;
            var canSetRangeStartAfterEnd;

            function updateRangeProperties(range) {
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = range.nativeRange[prop];
                }
            }

            function updateNativeRange(range, startContainer, startOffset, endContainer,endOffset) {
                var startMoved = (range.startContainer !== startContainer || range.startOffset != startOffset);
                var endMoved = (range.endContainer !== endContainer || range.endOffset != endOffset);

                if (endMoved) {
                    range.setEnd(endContainer, endOffset);
                }

                if (startMoved) {
                    range.setStart(startContainer, startOffset);
                }
            }

            function detach(range) {
                range.nativeRange.detach();
                range.detached = true;
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = null;
                }
            }

            var createBeforeAfterNodeSetter;

            WrappedRange = function(range) {
                if (!range) {
                    throw new Error("Range must be specified");
                }
                this.nativeRange = range;
                updateRangeProperties(this);
            };

            DomRange.createPrototypeRange(WrappedRange, updateNativeRange, detach);

            rangeProto = WrappedRange.prototype;

            rangeProto.selectNode = function(node) {
                this.nativeRange.selectNode(node);
                updateRangeProperties(this);
            };

            rangeProto.deleteContents = function() {
                this.nativeRange.deleteContents();
                updateRangeProperties(this);
            };

            rangeProto.extractContents = function() {
                var frag = this.nativeRange.extractContents();
                updateRangeProperties(this);
                return frag;
            };

            rangeProto.cloneContents = function() {
                return this.nativeRange.cloneContents();
            };

            // Until I can find a way to prgrammatically trigger the Firefox bug (apparently long-standing, still
            // present in 3.6.8) that throws "Index or size is negative or greater than the allowed amount" for
            // insertNode in some circumstances, all browsers will have to use the Rangy's own implementation of
            // insertNode, which works but is almost certainly slower than the native implementation.
/*
            rangeProto.insertNode = function(node) {
                this.nativeRange.insertNode(node);
                updateRangeProperties(this);
            };
*/

            rangeProto.surroundContents = function(node) {
                this.nativeRange.surroundContents(node);
                updateRangeProperties(this);
            };

            rangeProto.collapse = function(isStart) {
                this.nativeRange.collapse(isStart);
                updateRangeProperties(this);
            };

            rangeProto.cloneRange = function() {
                return new WrappedRange(this.nativeRange.cloneRange());
            };

            rangeProto.toString = function() {
                return this.nativeRange.toString();
            };

            // Create test range and node for deature detection

            var testTextNode = document.createTextNode("test");
            document.body.appendChild(testTextNode);
            var range = document.createRange();

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox bug (apparently long-standing, still present in 3.6.8) that throws "Index or size is
            // negative or greater than the allowed amount" for insertNode in some circumstances, and correct for it
            // by using DomRange's insertNode implementation

/*
            var span = document.body.insertBefore(document.createElement("span"), testTextNode);
            var spanText = span.appendChild(document.createTextNode("span"));
            range.setEnd(testTextNode, 2);
            range.setStart(spanText, 2);
            var nodeToInsert = document.createElement("span");
            nodeToInsert.innerHTML = "OIDUIIU"
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            range = sel.getRangeAt(0);
            //alert(range)
            range.insertNode(nodeToInsert);

            nodeToInsert.parentNode.removeChild(nodeToInsert);
            range.setEnd(testTextNode, 2);
            range.setStart(spanText, 2);
            nodeToInsert = document.createElement("span");
            nodeToInsert.innerHTML = "werw"
            range.insertNode(nodeToInsert);
            alert(range)
*/


            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox 2 bug that prevents moving the start of a Range to a point after its current end and
            // correct for it

            range.setStart(testTextNode, 0);
            range.setEnd(testTextNode, 0);

            try {
                range.setStart(testTextNode, 1);
                canSetRangeStartAfterEnd = true;

                rangeProto.setStart = function(node, offset) {
                    this.nativeRange.setStart(node, offset);
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    this.nativeRange.setEnd(node, offset);
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name, oppositeName) {
                    return function(node) {
                        this.nativeRange[name](node);
                        updateRangeProperties(this);
                    };
                };

            } catch(ex) {


                canSetRangeStartAfterEnd = false;

                rangeProto.setStart = function(node, offset) {
                    try {
                        this.nativeRange.setStart(node, offset);
                    } catch (ex) {
                        this.nativeRange.setEnd(node, offset);
                        this.nativeRange.setStart(node, offset);
                    }
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    try {
                        this.nativeRange.setEnd(node, offset);
                    } catch (ex) {
                        this.nativeRange.setStart(node, offset);
                        this.nativeRange.setEnd(node, offset);
                    }
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name, oppositeName) {
                    return function(node) {
                        try {
                            this.nativeRange[name](node);
                        } catch (ex) {
                            this.nativeRange[oppositeName](node);
                            this.nativeRange[name](node);
                        }
                        updateRangeProperties(this);
                    };
                };
            }

            rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
            rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
            rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
            rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for and correct Firefox 2 behaviour with selectNodeContents on text nodes: it collapses the range to
            // the 0th character of the text node
            range.selectNodeContents(testTextNode);
            if (range.startContainer == testTextNode && range.endContainer == testTextNode &&
                    range.startOffset == 0 && range.endOffset == testTextNode.length) {
                rangeProto.selectNodeContents = function(node) {
                    this.nativeRange.selectNodeContents(node);
                    updateRangeProperties(this);
                };
            } else {
                rangeProto.selectNodeContents = function(node) {
                    this.setStart(node, 0);
                    this.setEnd(node, rangeUtil.getEndOffset(node));
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for WebKit bug that has the beahviour of compareBoundaryPoints round the wrong way for constants
            // START_TO_END and END_TO_START: https://bugs.webkit.org/show_bug.cgi?id=20738

            range.selectNodeContents(testTextNode);
            range.setEnd(testTextNode, 3);

            var range2 = document.createRange();
            range2.selectNodeContents(testTextNode);
            range2.setEnd(testTextNode, 4);
            range2.setStart(testTextNode, 2);

            if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 && range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                // This is the wrong way round, so correct for it


                rangeProto.compareBoundaryPoints = function(type, range) {
                    range = range.nativeRange || range;
                    if (type == range.START_TO_END) {
                        type = range.END_TO_START;
                    } else if (type == range.END_TO_START) {
                        type = range.START_TO_END;
                    }
                    return this.nativeRange.compareBoundaryPoints(type, range);
                };
            } else {
                rangeProto.compareBoundaryPoints = function(type, range) {
                    return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Add extension methods from DomRange
/*
            var methodsToInherit = ["compareNode", "comparePoint", "createContextualFragment", "intersectsNode",
                "isPointInRange", "intersectsRange", "splitBoundaries", "normalizeBoundaries", "createNodeIterator",
                "getNodes", "containsNode", "containsNodeContents"];

            var i = methodsToInherit.length, methodName, domRangeProto = DomRange.prototype;
            while (i--) {
                methodName = methodsToInherit[i];
                rangeProto[methodName] = domRangeProto[methodName];
            }
*/

            // Clean up
            document.body.removeChild(testTextNode);
            range.detach();
            range2.detach();
/*

            DomRange.copyComparisonConstants(WrappedRange);
            DomRange.copyComparisonConstants(rangeProto);
*/
        })();

    } else if (api.features.implementsTextRange) {
        // This is a wrapper around a TextRange, providing full DOM Range functionality using rangy's DomRange as a
        // prototype

        WrappedRange = function(textRange) {
            var start, end;
            if (textRange.text) {

                end = getTextRangeBoundaryPosition(textRange, false);
                start = getTextRangeBoundaryPosition(textRange, true);
                start.cleanUp();
                end.cleanUp();
                this.alteredDom = start.alteredDom || end.alteredDom;
            } else {
                end = start = getTextRangeBoundaryPosition(textRange, true);
                start.cleanUp();
                this.alteredDom = start.alteredDom;
            }

            this.setStart(start.position.node, start.position.offset);
            this.setEnd(end.position.node, end.position.offset);
        };

        WrappedRange.prototype = new DomRange(document);

        WrappedRange.rangeToTextRange = function(range) {
            var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
            var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false);
            var textRange = dom.getDocument(range.startContainer).body.createTextRange();
            textRange.setEndPoint("StartToStart", startRange);
            textRange.setEndPoint("EndToEnd", endRange);
            return textRange;
        };

        DomRange.copyComparisonConstants(WrappedRange);

        // Add WrappedRange as the Range property of the global object to allow expression like Range.END_TO_END to work
        var globalObj = (function() { return this; })();
        if (typeof globalObj.Range == "undefined") {
            globalObj.Range = WrappedRange;
        }
    }

    api.WrappedRange = WrappedRange;

    api.createNativeRange = function(doc) {
        doc = doc || document;
        if (rangy.features.implementsDomRange) {
            return doc.createRange();
        } else if (rangy.features.implementsTextRange) {
            return doc.body.createTextRange();
        }
    };

    api.createRange = function(doc) {
        doc = doc || document;
        return new WrappedRange(api.createNativeRange(doc));
    };

    api.createRangyRange = function(doc) {
        doc = doc || document;
        return new DomRange(doc);
    };
});rangy.createModule("WrappedSelection", function(api, module) {
    // This will create a selection object wrapper that follows the HTML5 draft spec selections section
    // (http://dev.w3.org/html5/spec/editing.html#selection) and adds convenience extensions

    api.requireModules( ["DomRange", "WrappedRange"] );

    var BOOLEAN = "boolean";
    var dom = api.dom;
    var util = api.util;
    var DomRange = api.DomRange;
    var WrappedRange = api.WrappedRange;
    var DOMException = dom.DOMException;

    var getSelection, selectionIsCollapsed;



    // Test for the Range/TextRange and Selection features required
    // Test for ability to retrieve selection
    if (api.util.isHostMethod(window, "getSelection")) {
        getSelection = function(winParam) {
            return (winParam || window).getSelection();
        };
    } else if (api.util.isHostObject(document, "selection")) {
        getSelection = function(winParam) {
            return ((winParam || window).document.selection);
        };
    } else {
        module.fail("No means of obtaining a selection object");
    }

    api.getNativeSelection = getSelection;

    var testSelection = getSelection();
    var testRange = api.createNativeRange(document);

    // Obtaining a range from a selection
    var selectionHasAnchorAndFocus = util.areHostObjects(testSelection, ["anchorNode", "focusNode"] &&
                                     util.areHostProperties(testSelection, ["anchorOffset", "focusOffset"]));

    api.features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;

    // ControlRanges
    var selectionHasType = util.isHostProperty(testSelection, "type");
    var implementsControlRange = false, testControlRange;

    if (util.isHostObject(document, "body") && util.isHostMethod(document.body, "createControlRange")) {
        testControlRange = document.body.createControlRange();
        if (util.areHostProperties(testControlRange, ["item", "add"])) {
            implementsControlRange = true;
        }
    }
    api.features.implementsControlRange = implementsControlRange;

    // Selection collapsedness
    if (typeof testSelection.isCollapsed == BOOLEAN) {
        selectionIsCollapsed = function(sel) {
            return sel.nativeSelection.isCollapsed;
        };
    } else if (selectionHasAnchorAndFocus) {
        selectionIsCollapsed = function(sel) {
            return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
        };
    } else {
        selectionIsCollapsed = function(sel) {
            return sel.rangeCount ? sel.getRangeAt(0).collapsed : false;
        };
    }

    function updateAnchorAndFocusFromRange(sel, range) {
        sel.anchorNode = range.startContainer;
        sel.anchorOffset = range.startOffset;
        sel.focusNode = range.endContainer;
        sel.focusOffset = range.endOffset;
    }

    function updateAnchorAndFocusFromNativeSelection(sel) {
        var n = sel.nativeSelection;
        sel.anchorNode = n.anchorNode;
        sel.anchorOffset = n.anchorOffset;
        sel.focusNode = n.focusNode;
        sel.focusOffset = n.focusOffset;
    }

    function updateEmptySelection(sel) {
        sel.anchorNode = sel.focusNode = null;
        sel.anchorOffset = sel.focusOffset = 0;
        sel.rangeCount = 0;
        sel.isCollapsed = true;
    }

    function getNativeRange(range) {
        var nativeRange;
        if (range instanceof DomRange) {
            nativeRange = range._selectionNativeRange;
            if (!nativeRange) {
                nativeRange = api.createNativeRange(dom.getDocument(range.startContainer));
                nativeRange.setEnd(range.endContainer, range.endOffset);
                nativeRange.setStart(range.startContainer, range.startOffset);
                range._selectionNativeRange = nativeRange;
                range.attachListener("detach", function() {

                    this._selectionNativeRange = null;
                });
            }
        } else if (range instanceof WrappedRange) {
            nativeRange = range.nativeRange;
        } else if (window.Range && (range instanceof Range)) {
            nativeRange = range;
        }
        return nativeRange;
    }

    function getSingleElementFromRange(range) {
        var nodes = range.getNodes();
        if (nodes.length != 1 || nodes[0].nodeType != 1) {
            throw new Error("getSingleElementFromRange: range did not consist of a single element");
        }
        return nodes[0];
    }

    function updateFromControlRange(sel) {
        // Update the wrapped selection based on what's now in the native selection
        sel._ranges.length = 0;
        if (sel.nativeSelection.type == "None") {
            updateEmptySelection(sel);
        } else {
            var controlRange = sel.nativeSelection.createRange();
            sel.rangeCount = controlRange.length;
            var range, doc = dom.getDocument(controlRange.item(i));
            for (var i = 0; i < sel.rangeCount; ++i) {
                range = api.createRange(doc);
                range.selectNode(controlRange.item(i));
                sel._ranges.push(range);
            }
            sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
            updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1]);
        }
    }

    function WrappedSelection(selection) {
        this.nativeSelection = selection;
        this._ranges = [];
        this.refresh();
    }

    api.getSelection = function(win) {
        return new WrappedSelection(getSelection(win));
    };

    var selProto = WrappedSelection.prototype;

    // Selecting a range
    if (selectionHasAnchorAndFocus && util.areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
        selProto.removeAllRanges = function() {
            this.nativeSelection.removeAllRanges();
            updateEmptySelection(this);
        };

        selProto.addRange = function(range) {
            this.nativeSelection.addRange(getNativeRange(range));
            updateAnchorAndFocusFromNativeSelection(this);
            this.isCollapsed = selectionIsCollapsed(this);
            this.rangeCount = (typeof this.nativeSelection.rangeCount == "number") ?
                              this.nativeSelection.rangeCount : 1;
        };
    } else if (util.isHostMethod(testSelection, "empty") && util.isHostMethod(testRange, "select") &&
               selectionHasType && implementsControlRange) {

        selProto.removeAllRanges = function() {
            this.nativeSelection.empty();
            this._ranges.length = 0;
            updateEmptySelection(this);
        };

        selProto.addRange = function(range) {
            if (this.nativeSelection.type == "Control") {
                var controlRange = this.nativeSelection.createRange();
                var rangeElement = getSingleElementFromRange(range);

                // Create a new ControlRange containing all the elements in the selected ControlRange plus the element
                // contained by the supplied range
                var doc = dom.getDocument(controlRange.item(0));
                var newControlRange = doc.body.createControlRange();
                for (var i = 0, len = controlRange.length; i < len; ++i) {
                    newControlRange.add(controlRange.item(i));
                }
                newControlRange.add(rangeElement);
                newControlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateFromControlRange(this);
            } else {
                WrappedRange.rangeToTextRange(range).select();
                this._ranges.push(range);
                this.rangeCount = this._ranges.length;
                this.isCollapsed = this.rangeCount == 1 && this._ranges[0].collapsed;
            }
        };
    } else {
        module.fail("No means of selecting a Range or TextRange was found");
        return false;
    }

    if (util.isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == "number") {
        selProto.getRangeAt = function(index) {
            return new WrappedRange(this.nativeSelection.getRangeAt(index));
        };

        selProto.refresh = function() {
            updateAnchorAndFocusFromNativeSelection(this);
            this.isCollapsed = selectionIsCollapsed(this);
            this.rangeCount = this.nativeSelection.rangeCount;
        };
    } else if (selectionHasAnchorAndFocus && typeof testRange.collapsed == BOOLEAN && api.features.implementsDomRange) {
        selProto.getRangeAt = function(index) {
            if (index < 0 || index >= this.rangeCount) {
                throw new DOMException("INDEX_SIZE_ERR");
            } else {
                return this._ranges[index];
            }
        };

        selProto.refresh = function() {
            var doc, range, sel = this.nativeSelection;
            if (sel.anchorNode) {
                doc = dom.getDocument(sel.anchorNode);
                range = api.createRange(doc);
                range.setStart(sel.anchorNode, sel.anchorOffset);
                range.setEnd(sel.focusNode, sel.focusOffset);

                // Handle the case when the selection was selected backwards (from the end to the start in the
                // document)
                if (range.collapsed !== this.isCollapsed) {
                    range.setStart(sel.focusNode, sel.focusOffset);
                    range.setEnd(sel.anchorNode, sel.anchorOffset);
                }
                updateAnchorAndFocusFromNativeSelection(this);
                this.isCollapsed = range.collapsed;
                this._ranges = [range];
                this.rangeCount = 1;
            } else {
                updateEmptySelection(this);
                this._ranges = [];
            }
        };
    } else if (util.isHostMethod(testSelection, "createRange") && api.features.implementsTextRange) {
        selProto.getRangeAt = function(index) {
            if (index < 0 || index >= this.rangeCount) {
                throw new DOMException("INDEX_SIZE_ERR");
            } else {
                return this._ranges[index];
            }
        };

        selProto.refresh = function() {
            var range = this.nativeSelection.createRange(), wrappedRange, domRange;


            // We do nothing with ControlRanges, which don't naturally fit with the DOM Ranges. You could view a
            // selected Control Range as a selection containing multiple Ranges, each spanning an element, but these
            // Ranges should then be immutable, which Ranges are most definitely not.
            if (this.nativeSelection.type == "Control") {
                updateFromControlRange(this);
            } else if (range && typeof range.text != "undefined") {
                // Create a Range from the selected TextRange
                wrappedRange = new WrappedRange(range);
                this._ranges = [wrappedRange];

                // Next line is to work round a problem with the TextRange-to-DOM Range code in the case where a
                // range boundary falls within a preformatted text node containing line breaks: the original
                // TextRange is altered in the process, so if it was selected, the selection changes and we need to
                // create a new TextRange and select it
                if (wrappedRange.alteredDom) {
                    WrappedRange.rangeToTextRange(wrappedRange).select();
                }

                updateAnchorAndFocusFromRange(this, wrappedRange);
                this.rangeCount = 1;
                this.isCollapsed = wrappedRange.collapsed;
            } else {
                updateEmptySelection(this);
                this._ranges.length = this.rangeCount = 0;
            }
        };
    } else {
        module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
        return false;
    }

    // Removal of a single range

    if (util.isHostMethod(testSelection, "removeRange") && typeof testSelection.rangeCount == "number") {
        selProto.removeRange = function(range) {
            this.nativeSelection.removeRange(getNativeRange(range));
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = this.nativeSelection.rangeCount;
            this.isCollapsed = selectionIsCollapsed(this);
        };
    } else {
        var removeRangeManually = function(sel, range) {
            var ranges = sel.getAllRanges(), removed = false;
            sel.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                if (removed || !DomRange.util.rangesEqual(ranges[i], range)) {
                    sel.addRange(ranges[i]);
                } else {
                    // According to the HTML 5 spec, the same range may be added to the selection multiple times.
                    // removeRange should only remove the first instance, so the following ensures only the first
                    // instance is removed
                    removed = true;
                }
            }
            if (!sel.rangeCount) {
                updateEmptySelection(sel);
            }
        };

        if (selectionHasType && implementsControlRange) {
            selProto.removeRange = function(range) {
                if (this.nativeSelection.type == "Control") {
                    var controlRange = this.nativeSelection.createRange();
                    var rangeElement = getSingleElementFromRange(range);

                    // Create a new ControlRange containing all the elements in the selected ControlRange minus the
                    // element contained by the supplied range
                    var doc = dom.getDocument(controlRange.item(0));
                    var newControlRange = doc.body.createControlRange();
                    var el, removed = false;
                    for (var i = 0, len = controlRange.length; i < len; ++i) {
                        el = controlRange.item(i);
                        if (el !== rangeElement || removed) {
                            newControlRange.add(controlRange.item(i));
                        } else {
                            removed = true;
                        }
                    }
                    newControlRange.select();

                    // Update the wrapped selection based on what's now in the native selection
                    updateFromControlRange(this);
                } else {
                    removeRangeManually(this, range);
                }
            }
        } else {
            selProto.removeRange = function(range) {
                removeRangeManually(this, range);
            }
        }
    }

    // Detecting if a selection is backwards
    if (selectionHasAnchorAndFocus && api.features.implementsDomRange) {
        selProto.isBackwards = function() {
            var sel = this.nativeSelection, backwards = false;
            if (sel.anchorNode) {
                backwards = (dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1);
            }
            return backwards;
        };
    } else {
        selProto.isBackwards = function() {
            return false;
        };
    }

    // Selection text
    if (util.isHostMethod(testSelection, "toString")) {
        selProto.toString = function() {
            return "" + this.nativeSelection;
        };
    } else {
        selProto.toString = function() {

            var rangeTexts = [];
            for (var i = 0, len = this.rangeCount; i < len; ++i) {
                rangeTexts[i] = "" + this.getRangeAt(i);
            }
            return rangeTexts.join("");
        };
    }

    if (util.isHostMethod(testSelection, "collapse")) {
        selProto.collapse = function(node, offset) {
            this.nativeSelection.collapse(node, offset);
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = 1;
            this.isCollapsed = true;
        };
    } else {
        selProto.collapse = function(node, offset) {
            if (this.anchorNode && (dom.getDocument(this.anchorNode) !== dom.getDocument(node))) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }
            var range = api.createRange(dom.getDocument(node));
            range.setStart(node, offset);
            range.collapse(true);
            this.removeAllRanges();
            this.addRange(range);
            this.isCollapsed = true;
        };
    }

    if (util.isHostMethod(testSelection, "collapseToStart")) {
        selProto.collapseToStart = function() {
            this.nativeSelection.collapseToStart();
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = 1;
            this.isCollapsed = true;
        };
    } else {
        selProto.collapseToStart = function() {
            if (this.rangeCount) {
                var range = this.getRangeAt(0);
                range.collapse(true);
                this.removeAllRanges();
                this.addRange(range);
                this.isCollapsed = true;
            } else {
                throw new DOMException("INVALID_STATE_ERR");
            }
        };
    }

    if (util.isHostMethod(testSelection, "collapseToEnd")) {
        selProto.collapseToEnd = function() {
            this.nativeSelection.collapseToEnd();
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = 1;
            this.isCollapsed = true;
        };
    } else {
        selProto.collapseToEnd = function() {
            if (this.rangeCount) {
                var range = this.getRangeAt(this.rangeCount - 1);
                range.collapse(false);
                this.removeAllRanges();
                this.addRange(range);
                this.isCollapsed = true;
            } else {
                throw new DOMException("INVALID_STATE_ERR");
            }
        };
    }

    if (util.isHostMethod(testSelection, "selectAllChildren")) {
        selProto.selectAllChildren = function(node) {
            this.nativeSelection.selectAllChildren(node);
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = 1;
        };
    } else {
        selProto.selectAllChildren = function(node) {
            if (this.anchorNode && (dom.getDocument(this.anchorNode) !== dom.getDocument(node))) {
                throw new DOMException("WRONG_DOCUMENT_ERR");
            }
            var range = api.createRange(dom.getDocument(node));
            range.selectNodeContents(node);
            if (dom.isCharacterDataNode(node)) {
                range.collapse(true);
            }
            this.removeAllRanges();
            this.addRange(range);
        };
    }

    if (util.isHostMethod(testSelection, "deleteFromDocument")) {
        selProto.deleteFromDocument = function() {
            this.nativeSelection.deleteFromDocument();
            updateAnchorAndFocusFromNativeSelection(this);
            this.rangeCount = 1;
        };
    } else {
        selProto.deleteFromDocument = function() {
            if (this.rangeCount) {
                var ranges = this.getAllRanges();
                this.removeAllRanges();
                for (var i = 0, len = ranges.length; i < len; ++i) {
                    ranges[i].deleteContents();
                }
                // Firefox moves the selection to where the final selected range was, so we emulate that
                this.addRange(ranges[len - 1]);
            }
        };
    }

    // The following are non-standard extensions

    // TODO: Investigate Mozilla extensions containsNode, extend, [not modify - too hard], selectionLanguageChange

    // Thes two are mine, added for convenience
    selProto.getAllRanges = function() {

        var ranges = [];
        for (var i = 0; i < this.rangeCount; ++i) {
            ranges[i] = this.getRangeAt(i);
        }
        return ranges;
    };

    selProto.setRanges = function(ranges) {
        this.removeAllRanges();
        for (var i = 0, len = ranges.length; i < len; ++i) {
            this.addRange(ranges[i]);
        }
    };
});