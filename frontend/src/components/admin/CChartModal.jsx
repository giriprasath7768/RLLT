import React from 'react';
import { Dialog } from 'primereact/dialog';
import CChart from '../../pages/admin/CChart';

const CChartModal = ({ visible, onHide, onInsert }) => {
    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header="C-Chart Interface"
            style={{ width: '95vw', maxWidth: '1200px' }}
            maximizable
            modal
            contentClassName="p-0 border-0 bg-gray-50"
        >
            {visible && <CChart isEmbedMode={true} onInsert={onInsert} />}
        </Dialog>
    );
};

export default CChartModal;
