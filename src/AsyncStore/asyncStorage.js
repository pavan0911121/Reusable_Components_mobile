import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value)
    } catch (e) {
        console.error('Error while saving data: ', e);
    }
}

export const storeJsonData = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
        console.error('Error while saving data: ', e);
    }
}

export const getData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key)
        return value !== null ? value : null;
    } catch (e) {
        console.error('Error while retriving data: ', e);
        return null;
    }
}

export const getJsonData = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key)
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error while retriving data: ', e);
        return null;
    }
}

export const multiGetData = async (keys) => {
    try {
        const value = await AsyncStorage.multiGet(keys)
        return value !== null ? value : null;
    } catch (e) {
        console.error('Error while retriving data: ', e);
        return null;
    }
}

export const multiRemove = async (keys) => {
    try {
        const value = await AsyncStorage.multiRemove(keys)
        return value !== null ? value : null;
    } catch (e) {
        console.error('Error while retriving data: ', e);
        return null;
    }
}
