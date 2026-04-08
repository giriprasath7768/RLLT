import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';
import { LocationService } from '../../services/locations';
import { CONTINENTS, COUNTRIES, CITIES_MAP } from '../../utils/locationData';
import MobileDataCard from '../../components/common/MobileDataCard';
import '../../assets/css/AdminManagement.css';

export default function LocationCRUD() {
    let emptyLocation = { id: null, continent: '', country: '', city: '' };

    const [locations, setLocations] = useState([]);
    const [locationDialog, setLocationDialog] = useState(false);
    const [deleteLocationDialog, setDeleteLocationDialog] = useState(false);
    const [deleteLocationsDialog, setDeleteLocationsDialog] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState(null);
    const [location, setLocation] = useState(emptyLocation);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    // Dynamic dropdown states
    const [isCustomCountry, setIsCustomCountry] = useState(false);
    const [customCountryName, setCustomCountryName] = useState('');
    const [isCustomCity, setIsCustomCity] = useState(false);
    const [customCityName, setCustomCityName] = useState('');
    const [availableCities, setAvailableCities] = useState([]);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = () => {
        LocationService.getLocations()
            .then(data => setLocations(data))
            .catch(err => console.error("Could not load locations", err));
    };

    const openNew = () => {
        setLocation(emptyLocation);
        setSubmitted(false);
        setIsCustomCountry(false);
        setCustomCountryName('');
        setIsCustomCity(false);
        setCustomCityName('');
        setAvailableCities([]);
        setLocationDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setLocationDialog(false);
    };

    const hideDeleteLocationDialog = () => {
        setDeleteLocationDialog(false);
    };

    const saveLocation = () => {
        setSubmitted(true);

        // Compute final country/city based on custom inputs
        const finalCountry = isCustomCountry ? customCountryName : location.country;
        const finalCity = isCustomCity ? customCityName : location.city;

        if (location.continent && finalCountry && finalCity) {
            let _location = { ...location, country: finalCountry, city: finalCity };

            if (_location.id) {
                LocationService.updateLocation(_location.id, _location)
                    .then(() => {
                        toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Location Updated', life: 3000 });
                        loadLocations();
                    });
            } else {
                LocationService.createLocation(_location)
                    .then(() => {
                        toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Location Created', life: 3000 });
                        loadLocations();
                    });
            }
            setLocationDialog(false);
            setLocation(emptyLocation);
        }
    };

    const editLocation = (loc) => {
        setLocation({ ...loc });
        
        // Setup initial dropdown states for editing
        setIsCustomCountry(false);
        setIsCustomCity(false);
        setCustomCountryName('');
        setCustomCityName('');
        
        // Check if country exists in standard list
        const isStandardCountry = COUNTRIES.includes(loc.country);
        if (!isStandardCountry) {
            setIsCustomCountry(true);
            setCustomCountryName(loc.country);
            setLocation(prev => ({...prev, country: '+ Add New Country'}));
        }
        
        // Populate available cities
        const mappedCities = CITIES_MAP[loc.country] || [];
        setAvailableCities(mappedCities);
        
        const isStandardCity = mappedCities.includes(loc.city);
        if (!isStandardCity) {
            setIsCustomCity(true);
            setCustomCityName(loc.city);
            setLocation(prev => ({...prev, city: '+ Add New City'}));
        }

        setLocationDialog(true);
    };

    const confirmDeleteLocation = (loc) => {
        setLocation(loc);
        setDeleteLocationDialog(true);
    };

    const deleteLocation = () => {
        LocationService.deleteLocation(location.id).then(() => {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Location Deleted', life: 3000 });
            loadLocations();
        });
        setDeleteLocationDialog(false);
        setLocation(emptyLocation);
    };

    const confirmDeleteSelected = () => {
        setDeleteLocationsDialog(true);
    };

    const deleteSelectedLocations = () => {
        const deletePromises = selectedLocations.map(loc => LocationService.deleteLocation(loc.id));
        Promise.all(deletePromises)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Locations Deleted', life: 3000 });
                setDeleteLocationsDialog(false);
                setSelectedLocations(null);
                loadLocations();
            })
            .catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Bulk deletion failed', life: 3000 });
            });
    };

    const onContinentChange = (e) => {
        const val = (e.target && e.target.value) || '';
        let _location = { ...location, continent: val, country: '', city: '' };
        setLocation(_location);
        setIsCustomCountry(false);
        setIsCustomCity(false);
    };

    const onCountryChange = (e) => {
        const val = (e.target && e.target.value) || '';
        let _location = { ...location, country: val, city: '' };
        
        if (val === '+ Add New Country') {
            setIsCustomCountry(true);
            setAvailableCities([]);
        } else {
            setIsCustomCountry(false);
            setAvailableCities(CITIES_MAP[val] || []);
        }
        
        setIsCustomCity(false);
        setLocation(_location);
    };

    const onCityChange = (e) => {
        const val = (e.target && e.target.value) || '';
        let _location = { ...location, city: val };
        
        if (val === '+ Add New City') {
            setIsCustomCity(true);
        } else {
            setIsCustomCity(false);
        }
        
        setLocation(_location);
    };

    const topCardContent = (
        <div className="flex flex-wrap gap-2 w-full justify-start">
            <Button label="New Location" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            <Button label="Export" icon="pi pi-upload" severity="help" onClick={() => dt.current.exportCSV()} />
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Manage Locations</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editLocation(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteLocation(rowData)} />
            </React.Fragment>
        );
    };

    const locationDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveLocation} />
        </React.Fragment>
    );

    const deleteLocationDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteLocationDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteLocation} />
        </React.Fragment>
    );

    const deleteLocationsDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteLocationsDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteSelectedLocations} />
        </React.Fragment>
    );

    const countryOptions = [...COUNTRIES, '+ Add New Country'].map(c => ({ label: c, value: c }));
    const cityOptions = [...availableCities, '+ Add New City'].map(c => ({ label: c, value: c }));

    const filteredLocations = locations.filter(loc => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (loc.continent && loc.continent.toLowerCase().includes(search)) ||
            (loc.country && loc.country.toLowerCase().includes(search)) ||
            (loc.city && loc.city.toLowerCase().includes(search))
        );
    });

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable ref={dt} value={locations} dataKey="id" 
                            paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                            globalFilter={globalFilter} header={tableHeader}
                            className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines scrollable scrollDirection="both"
                            rowClassName={() => 'bg-white text-black'}>
                        
                    <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ minWidth: '4rem' }} headerClassName="admin-table-header"></Column>
                    <Column field="continent" header="Continent" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                    <Column field="country" header="Country" sortable style={{ minWidth: '16rem' }} headerClassName="admin-table-header"></Column>
                    <Column field="city" header="Location (City)" sortable style={{ minWidth: '16rem' }} headerClassName="admin-table-header"></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredLocations.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} locations" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredLocations.length > 0 ? (
                        filteredLocations.map(loc => (
                            <MobileDataCard 
                                key={loc.id}
                                title={loc.city}
                                data={[
                                    { label: 'Country', value: loc.country },
                                    { label: 'Continent', value: loc.continent }
                                ]}
                                onEdit={() => editLocation(loc)}
                                onDelete={() => confirmDeleteLocation(loc)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No locations found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={locationDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '95vw' }} header="Location Details" modal className="p-fluid" footer={locationDialogFooter} onHide={hideDialog}>
                {/* Continent selection */}
                <div className="field mb-4">
                    <label htmlFor="continent" className="font-bold block mb-2">Continent</label>
                    <Dropdown id="continent" value={location.continent} options={CONTINENTS} onChange={onContinentChange} placeholder="Select a Continent" 
                        required className={classNames({ 'p-invalid': submitted && !location.continent })} />
                    {submitted && !location.continent && <small className="p-error">Continent is required.</small>}
                </div>

                {/* Country selection - conditionally enabled */}
                <div className="field mb-4">
                    <label htmlFor="country" className="font-bold block mb-2">Country</label>
                    <Dropdown id="country" value={location.country} options={countryOptions} onChange={onCountryChange} placeholder="Select a Country" filter
                        disabled={!location.continent} required className={classNames({ 'p-invalid': submitted && !location.country && !isCustomCountry })} />
                    
                    {/* Nested Input for custom country */}
                    {isCustomCountry && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label htmlFor="customCountry" className="text-sm text-gray-600 block mb-1">Enter New Country Name</label>
                            <InputText id="customCountry" value={customCountryName} onChange={(e) => setCustomCountryName(e.target.value)} 
                                required autoFocus className={classNames({ 'p-invalid': submitted && isCustomCountry && !customCountryName })} />
                            {submitted && isCustomCountry && !customCountryName && <small className="p-error">Country name is required.</small>}
                        </div>
                    )}
                    {submitted && !location.country && !isCustomCountry && <small className="p-error">Country is required.</small>}
                </div>

                {/* City selection - conditionally enabled */}
                <div className="field mb-4">
                    <label htmlFor="city" className="font-bold block mb-2">Location (City)</label>
                    <Dropdown id="city" value={location.city} options={cityOptions} onChange={onCityChange} placeholder="Select a City" filter
                        disabled={!location.country} required className={classNames({ 'p-invalid': submitted && !location.city && !isCustomCity })} />
                    
                    {/* Nested Input for custom city */}
                    {isCustomCity && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label htmlFor="customCity" className="text-sm text-gray-600 block mb-1">Enter New City Name</label>
                            <InputText id="customCity" value={customCityName} onChange={(e) => setCustomCityName(e.target.value)} 
                                required autoFocus className={classNames({ 'p-invalid': submitted && isCustomCity && !customCityName })} />
                            {submitted && isCustomCity && !customCityName && <small className="p-error">City name is required.</small>}
                        </div>
                    )}
                    {submitted && !location.city && !isCustomCity && <small className="p-error">City is required.</small>}
                </div>
            </Dialog>

            <Dialog visible={deleteLocationDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteLocationDialogFooter} onHide={hideDeleteLocationDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {location && (
                        <span>
                            Are you sure you want to delete the location <b>{location.city}, {location.country}</b>?
                        </span>
                    )}
                </div>
            </Dialog>

            <Dialog visible={deleteLocationsDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Bulk Deletion" modal footer={deleteLocationsDialogFooter} onHide={() => setDeleteLocationsDialog(false)}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {selectedLocations && <span>Are you sure you want to delete the selected locations?</span>}
                </div>
            </Dialog>
        </div>
    );
}

// Simple classNames helper since classnames library isn't guaranteed
const classNames = (obj) => {
    return Object.entries(obj)
        .filter(([_, value]) => Boolean(value))
        .map(([key, _]) => key)
        .join(' ');
};
