import React from 'react';
import { render } from 'react-dom'
import Canvas from './App';

const root = document.querySelector('#app');

render(
    <React.StrictMode>
        <Canvas />
    </React.StrictMode>,
    root
);