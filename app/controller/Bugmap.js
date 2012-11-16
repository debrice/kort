Ext.define('Kort.controller.Bugmap', {
    extend: 'Ext.app.Controller',
    requires: [
        'Ext.LoadMask'
    ],

    config: {
        views: [
            'bugmap.BugMessageBox',
            'bugmap.NavigationView',
            'bugmap.fix.TabPanel'
        ],
        refs: {
            mainTabPanel: '#mainTabPanel',
            mapCmp: '#bugmap',
            bugmapNavigationView: '#bugmapNavigationView',
            refreshBugsButton: '#refreshBugsButton'
        },
        control: {
            mapCmp: {
                maprender: 'onMapRender'
            },
            refreshBugsButton: {
                tap: 'onRefreshBugsButtonTap'
            },
            bugmapNavigationView: {
                push: 'onBugmapNavigationViewPush',
                pop: 'onBugmapNavigationViewPop'
            }
        },

        routes: {
            'bugmap': 'showBugmap'
        },

        map: null,
        ownPositionMarker: null,
        markerLayerGroup: [],
        activeBug: null,
        bugsStore: null,
        messageBoxTemplate: null
    },

    showBugmap: function() {
        this.getMainTabPanel().setActiveItem(this.getBugmapNavigationView());
    },

    onBugmapNavigationViewPush: function(cmp, view, opts) {
        //this.getRefreshBugsButton().hide();
    },
    onBugmapNavigationViewPop: function(cmp, view, opts) {
        //this.getRefreshBugsButton().show();
    },

    onMapRender: function(cmp, map, tileLayer) {
        var me = this;
        me.setMap(map);

        // adding markers
        if(cmp.getGeo()) {
            me.addOwnPositionMarker(cmp, map);

            // add listener for locationupdate event of geolocation for setting marker position
            cmp.getGeo().addListener('locationupdate', function() {
                // this referes to the geolocation
                me.setOwnPositionMarkerPosition(L.latLng(this.getLatitude(), this.getLongitude()));
            });
        }

        // wait until correct position is found
        Ext.Function.defer(me.refreshBugMarkers, 700, me);

        me.getMarkerLayerGroup().addTo(map);
    },

    onRefreshBugsButtonTap: function() {
        this.refreshBugMarkers();
    },

    refreshBugMarkers: function() {
        var me = this,
            lat = me.getMapCmp().getGeo().getLatitude(),
            lng = me.getMapCmp().getGeo().getLongitude(),
            bugsStore = me.getBugsStore(),
            url;

        url = './server/webservices/bug/position/' + lat + ',' + lng;
        bugsStore.getProxy().setUrl(url);
        
        me.showLoadMask();
        
        // centering map to current position
        me.getMapCmp().setMapCenter(L.latLng(lat, lng));
        
        // Load bugs store
		bugsStore.load(function(records, operation, success) {
            me.syncProblemMarkers(records);
        });
    },

    /**
    * Synchronizes problem markers with recieved data from fusiontable
    * @private
    */
	syncProblemMarkers: function(bugs) {
        var me = this;

        me.removeAllMarkers();

        // add markers
        Ext.each(bugs, function (bug, index, length) {
            if(bug.get('longitude') && bug.get('longitude')) {
                console.log(bug.get('osm_type') + ' / ' + bug.get('osm_id') + ' / ' + bug.get('view_type') + ' / ' + bug.get('latitude') + ' / ' + bug.get('longitude'));
                me.addMarker(bug);
            }
        });
        me.hideLoadMask();
	},

    addOwnPositionMarker: function(cmp, map) {
        var iconWidth = 20,
            iconHeight = 20,
            icon,
            ownPositionMarker;

        icon = L.icon({
            iconUrl: './resources/images/marker_icons/own_position.png',
            iconSize: [iconWidth, iconHeight],
            iconAnchor: [(iconWidth/2), (iconHeight/2)]
        });
        ownPositionMarker = L.marker([cmp.getGeo().getLatitude(), cmp.getGeo().getLongitude()], {
            icon: icon,
            clickable: false
        });
        this.setOwnPositionMarker(ownPositionMarker);
        ownPositionMarker.addTo(map);
    },

    /**
     * Sets position of own position marker
     * @param latlng position of marker
     * @private
     */
    setOwnPositionMarkerPosition: function(latlng) {
        var ownPositionMarker = this.getOwnPositionMarker();
        if(ownPositionMarker) {
            ownPositionMarker.setLatLng(latlng);
        }
    },

    addMarker: function(bug) {
        var me = this,
            icon,
            marker;

        icon = Kort.util.Config.getMarkerIcon(bug.get('type'));
        marker = L.marker([bug.get('latitude'), bug.get('longitude')], {
            icon: icon
        });

        marker.bug = bug;
        marker.lastClickTimestamp = 0;
        marker.on('click', me.onMarkerClick, me);
        me.getMarkerLayerGroup().addLayer(marker);
    },

    removeAllMarkers: function() {
        this.getMarkerLayerGroup().clearLayers();
    },

    onMarkerClick: function(e) {
        var tpl,
            marker = e.target,
            bug = marker.bug,
            CLICK_TOLERANCE = 200,
            timeDifference, bugMessageBox;

        timeDifference = e.originalEvent.timeStamp - marker.lastClickTimestamp;

        // LEAFLET BUGFIX: only execute click if there is a certain time between last click
        if(timeDifference > CLICK_TOLERANCE) {
            tpl = this.getMessageBoxTemplate();
            marker.lastClickTimestamp = e.originalEvent.timeStamp;
            this.setActiveBug(bug);
            bugMessageBox = Ext.create('Kort.view.bugmap.BugMessageBox', {
                record: bug
            });
            bugMessageBox.confirm(bug.get('title'), tpl.apply(bug.data), this.markerConfirmHandler, this);
        }
    },

    markerConfirmHandler: function(buttonId, value, opt) {
        if(buttonId === 'yes') {
            console.log('Open fix (id: ' + this.getActiveBug().data.id + ')');
            this.showFix(this.getActiveBug());
        }

        this.setActiveBug(null);
    },

    showFix: function(bug) {
        var fixTabPanel = Ext.create('Kort.view.bugmap.fix.TabPanel', {
            record: bug,
            title: bug.get('title')
        });
        this.getBugmapNavigationView().push(fixTabPanel);
    },

    showLoadMask: function() {
        this.getBugmapNavigationView().setMasked({
            xtype: 'loadmask',
            message: Ext.i18n.Bundle.message('bugmap.loadmask.message'),
            zIndex: Kort.util.Config.getZIndex().overlayLeafletMap
        });
    },
    
    hideLoadMask: function() {
        this.getBugmapNavigationView().setMasked(false);
    },

    init: function() {
        // create layer group for bug markers
        this.setMarkerLayerGroup(L.layerGroup());

        this.setBugsStore(Ext.getStore('Bugs'));
        
        this.setMessageBoxTemplate(
            new Ext.Template(
                '<div class="confirm-content">',
                    '<div class="description">',
                        '<div class="image">',
                            '<img class="bugtype-image" src="./resources/images/marker_icons/{type}.png" />',
                        '</div>',
                        '<div class="content">',
                            '<p>{description}</p>',
                        '</div>',
                    '</div>',
                '</div>'
            )
        );
    }
});
