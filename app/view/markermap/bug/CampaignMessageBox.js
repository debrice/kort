Ext.define('Kort.view.markermap.bug.CampaignMessageBox', {
    extend: 'Ext.MessageBox',

    config: {
        cls: 'campaignMessageBox',
        zIndex: Kort.util.Config.getZIndex().overlayLeafletMap + 1,
        showAnimation: false,
        hideAnimation: false
    },
    tpl: new Ext.XTemplate(
        '<div align="center"><b>{title}</b></div>',
        ' <br>',
        ' <div align="center">{startdate} bis {enddate}</div>',
        '<div align="center">Hol dir zusätzliche {extra_coins} Koins!</div>'
    ),

    statics: {
        YES: [
            { text: Ext.i18n.Bundle.message('markermap.bug.campaignmessagebox.close'), itemId: 'yes', ui: 'action'}
        ]
    },

    /**
     * @inheritdoc
     * OVERRIDEN SENCHA TOUCH FUNCTION
     * CHANGE: use own yes/no labels
     */
    confirm: function(record, fn, scope) {
        return this.show({
            title       : null,
            message     : this.tpl.apply(record.data) || null,
            // use own yes/no labels
            buttons     : Kort.view.markermap.bug.CampaignMessageBox.YES,
            promptConfig: false,
            scope       : scope,
            fn: function() {
                if (fn) {
                    fn.apply(scope, arguments);
                }
            }
        });
    }




});
