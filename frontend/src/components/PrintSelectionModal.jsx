import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

export default function PrintSelectionModal({ visible, onHide, columns, onPrint }) {
    const [selectedColumns, setSelectedColumns] = useState([]);

    useEffect(() => {
        if (visible && columns) {
            // Default select all columns when opened
            setSelectedColumns(columns.map(col => col.field));
        }
    }, [visible, columns]);

    const onCheckboxChange = (e, field) => {
        let _selectedColumns = [...selectedColumns];
        if (e.checked) {
            _selectedColumns.push(field);
        } else {
            _selectedColumns = _selectedColumns.filter(c => c !== field);
        }
        setSelectedColumns(_selectedColumns);
    };

    const handlePrint = () => {
        onPrint(selectedColumns);
    };

    const footer = (
        <div className="flex justify-end gap-2 mt-4">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text p-button-secondary" autoFocus />
            <Button label="Print" icon="pi pi-print" onClick={handlePrint} disabled={selectedColumns.length === 0} severity="success" />
        </div>
    );

    return (
        <Dialog 
            header={<span className="text-white">Select Columns to Print</span>} 
            visible={visible} 
            style={{ width: '30vw', minWidth: '320px' }} 
            breakpoints={{ '960px': '50vw', '641px': '90vw' }}
            onHide={onHide}
            footer={footer}
            className="p-fluid"
        >
            <div className="flex flex-col gap-4 mt-2">
                <p className="text-gray-300 mb-2">Choose the columns you want to include in the print out.</p>
                {columns && columns.map(col => (
                    <div key={col.field} className="flex items-center">
                        <Checkbox 
                            inputId={`col-${col.field}`} 
                            name="column" 
                            value={col.field} 
                            onChange={(e) => onCheckboxChange(e, col.field)} 
                            checked={selectedColumns.includes(col.field)} 
                        />
                        <label htmlFor={`col-${col.field}`} className="ml-3 cursor-pointer text-white font-medium">
                            {col.header}
                        </label>
                    </div>
                ))}
            </div>
        </Dialog>
    );
}
