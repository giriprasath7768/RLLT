import React from 'react';
import { Button } from 'primereact/button';

export default function MobileDataCard({ title, data, onEdit, onDelete, extraBody }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-3 flex flex-col block md:hidden">
            <h4 className="font-bold text-lg m-0 border-b border-gray-100 pb-2 mb-3 text-gray-800">{title}</h4>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4">
                {data.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className="text-gray-500 font-medium">{item.label}</div>
                        <div className="text-gray-900 truncate" title={item.value}>{item.value}</div>
                    </React.Fragment>
                ))}
            </div>

            {extraBody && (
                <div className="mb-4">
                    {extraBody}
                </div>
            )}

            <div className="flex gap-2 w-full mt-auto pt-2">
                <Button label="Edit" icon="pi pi-pencil" outlined className="flex-1" onClick={onEdit} />
                <Button label="Delete" icon="pi pi-trash" outlined severity="danger" className="flex-1" onClick={onDelete} />
            </div>
        </div>
    );
}
