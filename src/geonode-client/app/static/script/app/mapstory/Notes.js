/*jslint browser: true, nomen: true, indent: 4, maxlen: 80 */
/*global gxp, OpenLayers, Ext, GeoExt, mapstory */

(function () {
    'use strict';

    Ext.ns('mapstory');

    mapstory.VectorSource = Ext.extend(gxp.plugins.LayerSource, {
        ptype: 'ms_vector_source',
        store: null,
        lazy: false,
        hidden: true,
        title: 'Vector Layers',

        createStore: function () {

        }

    });

    mapstory.NoteStore = new Ext.data.Store({});

    mapstory.GridPanel = new Ext.grid.GridPanel({
        height: 400,
        width: 400,
        store: mapstory.NoteStore
    });


    mapstory.NotesManager = Ext.extend(gxp.plugins.Tool, {
        ptype: 'ms_notes_manager',
        menuText: 'Manage annotations',
        layerName: 'annotations',
        // save a reference to the openlayers map
        map: null,
        layer: null,
        isNewMap: null,

        createStore: function (target) {

            this.store = new GeoExt.data.FeatureStore({
                fields: [
                    {name: 'geometry'},
                    {name: 'name', type: 'string'},
                    {name: 'type', type: 'string'}
                ],
                proxy: new GeoExt.data.ProtocolProxy({
                    protocol: new OpenLayers.Protocol.HTTP({
                        url: "/map" + target.id + "/annotations",
                        format: new OpenLayers.Format.GeoJSON()
                    })
                }),
                autoLoad: true
            });
        },

        constructor: function (config) {
            mapstory.NotesManager.superclass.constructor.apply(
                this,
                arguments
            );

            this.protocol = config.protocol || mapstory.notes.Protocol;
            this.strategies = config.strategies || [
                new OpenLayers.Strategy.Fixed()
            ];
        },


        init: function (target) {
            var self = this;
            mapstory.NotesManager.superclass.init.apply(this, arguments);
            // we need to wait until the all of the layers have been
            // added to add the vector layer
            // this seems like a poor way of making sure the
            // annotations layer is on the top
            target.on({
                'ready': function () {
                    if (!self.isNewMap) {
                        self.createStore(target);
                    }
                }
            });
            // save a reference to the ol map object
            this.map = target.mapPanel.map || null;
            // check if there is a target.id. if there is not that
            // means its a new map, we want to suppress the notes
            // manager
            this.isNewMap = !target.id;
            // if we give gxp this property, it will automaticly call
            // our addOutput method
            this.outputAction = 0;

            if (!this.isNewMap) {
                this.loadVectorLayer(target);
            }

        },
        buildMenu: function () {
            return [
                {
                    text: this.menuText,
                    scope: this
                }
            ];
        },
        addOutput: function () {
            alert('make a grid now');
        },

        addActions: function () {
            // if the map is a saved map, turn on the menu
            // otherwise do nothing
            // check with bart about this
            if (!this.isNewMap) {
                return mapstory.NotesManager.superclass.addActions.apply(
                    this,
                    this.buildMenu()
                );
            }
        }

    });

    Ext.preg(mapstory.NotesManager.prototype.ptype, mapstory.NotesManager);

}());
