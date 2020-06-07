import React, { useEffect, useState } from 'react';
import './CreatePoint.css';
import { FiArrowLeft } from 'react-icons/fi';
import logo from './../../Assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from './../../Services/api';
import axios from './../../Services/api';

interface Items {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEufResponse {
    sigla: string;
}
interface IBGEcityResponse {
    nome: string;
}

declare global {
    interface Array<T> {
        remove(o: T): Array<T>;
    }
}

const CreatePoint = () => {
    const [items, setItems] = useState<Items[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState<string>('0');
    const [city, setCity] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('0');
    const [position, setPosition] = useState<[number, number]>([0, 0]);
    const [userPosition, setUserPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

    useEffect(() => {
        api.get('items').then((response) => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        axios
            .get<IBGEufResponse[]>(
                'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
            )
            .then((response) => {
                const ufInitials = response.data.map((uf) => uf.sigla);
                setUfs(ufInitials);
            });
    }, []);

    useEffect(() => {
        if (selectedUf === '0') {
            return;
        } else {
            axios
                .get<IBGEcityResponse[]>(
                    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`,
                )
                .then((response) => {
                    const cityNames = response.data.map((city) => city.nome);
                    setCity(cityNames);
                });
        }
    }, [selectedUf]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setUserPosition([latitude, longitude]);
        });
    }, []);

    const handleSelectedUf = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const uf = e.target.value;
        setSelectedUf(uf);
    };

    const handleSelectedCity = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const city = e.target.value;
        setSelectedCity(city);
        console.log(selectedCity);
    };

    const handleMapClick = (e: LeafletMouseEvent) => {
        console.log(e.latlng);
        setPosition([e.latlng.lat, e.latlng.lng]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectItem = (id: number) => {
        const alreadySelected = selectedItems.findIndex((item) => item === id);

        if (alreadySelected !== -1) {
            const filteredItems = selectedItems.filter((item) => item !== id);
            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([...selectedItems, id]);
        }
        console.log(selectedItems);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [lat, long] = position;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            lat,
            long,
            items,
        };
        try {
            await api.post('points', data);
            history.push('/');
        } catch (error) {
            alert('erro');
        }
    };

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>
                    Cadastro do <br /> ponto de coleta
                </h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="text"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input
                                type="number"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map
                        center={userPosition}
                        zoom={11}
                        zoomAnimation
                        onclick={handleMapClick}
                    >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position} />
                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado - UF</label>
                            <select
                                name="uf"
                                id="uf"
                                onChange={handleSelectedUf}
                                value={selectedUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map((uf) => (
                                    <option key={uf} value={uf}>
                                        {uf}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                name="city"
                                id="city"
                                onChange={handleSelectedCity}
                                value={selectedCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {city.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map((item) => {
                            return (
                                <li
                                    key={item.id}
                                    onClick={() => handleSelectItem(item.id)}
                                    className={
                                        selectedItems.includes(item.id)
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                    />
                                    <span>{item.title}</span>
                                </li>
                            );
                        })}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
};

export default CreatePoint;
