Ext.ns('mapstory.plugins');

mapstory.plugins.CatalogueSource = Ext.extend(gxp.plugins.GeoNodeCatalogueSource, {

    /** api: ptype = ms_cataloguesource */
    ptype: "ms_cataloguesource",

    hidden: false,

    rootProperty: "rows",

    minChars: 3,

    minCharsTitle: "Layer Search",

    minCharsError: "Please specify at least {count} characters",

    fields: [
        {name: "name"},
        {name: "id"},
        {name: "title"},
        {name: "abstract"},
        {name: "thumb"},
        {name: "owner"},
        {name: "owner_detail"},
        {name: "_display_type"},
        {name: "last_modified"},
        {name: "views"},
        {name: "rating"},
        {name: "_type"},
        {name: "owsUrl", convert: function(v) {
            if (v.indexOf('/wms') !== -1 || v.indexOf('/ows') !== -1) {
                return v;
            } else {
                return v.charAt(v.length-1) === '/' ? v + 'ows' : v + '/ows';
            }
        }}
    ],

    baseParams: {limit: 0, sort: 'alphaaz'},

    constructor: function(config) {
        mapstory.plugins.CatalogueSource.superclass.constructor.apply(this, arguments);
        this.on('ready', function() {
            this.store.on('beforeload', function(store, options) {
                if (store.baseParams.q !== undefined && store.baseParams.q.length < this.minChars) {
                    Ext.Msg.alert(this.minCharsTitle, new Ext.Template(this.minCharsError).apply({count: this.minChars}));
                }
                return store.baseParams.q !== undefined && store.baseParams.q.length >=  this.minChars;
            }, this);
        }, this);
    },

    createLayerRecord: function(config, callback, scope) {
        var idx = this.store.findExact('name', config.name);
        if (idx === -1) {
            return;
        }
        var rec = this.store.getAt(idx);
        var url = rec.get('owsUrl');
        var name = config.name.indexOf(":") !== -1 ? config.name.split(":")[1] : config.name;
        var restUrl;
        for (var key in this.target.layerSources) {
            var src= this.target.layerSources[key];
            if (src.restUrl) {
                restUrl = src.restUrl;
            }
        }

        var id = config.name + '-' + config.source;
        var sourceExists = this.target.layerSources[id];
        var source = sourceExists || this.target.addLayerSource({
            "id": id,
            config: {
                isLazy: OpenLayers.Function.False,
                ptype: 'gxp_wmscsource',
                hidden: true,
                restUrl: restUrl,
                version: "1.1.1",
                url: url
            }
        });
        if (sourceExists) {
            this.target.createLayerRecord({
               source: source.id,
                name: name
            }, callback, scope);
        } else {
            source.on({
                "ready": function() {
                    this.target.createLayerRecord({
                        source: source.id,
                        name: name
                    }, callback, scope);
                },
                scope: this
            });
        }
    }

});

Ext.preg(mapstory.plugins.CatalogueSource.prototype.ptype, mapstory.plugins.CatalogueSource);