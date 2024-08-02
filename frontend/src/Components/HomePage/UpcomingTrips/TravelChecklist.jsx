import { useState } from 'react';
import { FaPlus, FaTrash, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import PropTypes from 'prop-types';
import './TravelChecklist.css';

function useSessionStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
        } catch (error) {
        console.log(error);
        return initialValue;
        }
    });

    const setValue = (value) => {
        try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        sessionStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
        console.log(error);
        }
    };

    return [storedValue, setValue];
    }

    const ChecklistItem = ({ item, onToggle, onDelete, onEdit, onAddSubItem }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAddSubItem = () => {
        onAddSubItem(item.id);
        setIsExpanded(true);
    };

    return (
        <li className={item.completed ? 'completed' : ''}>
        <div className="item-content">
            <button 
            className="expand-button" 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{visibility: item.subItems.length > 0 ? 'visible' : 'hidden'}}
            >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
            <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggle(item.id)}
            />
            <span className="item-text">{item.text}</span>
            <button className="add-sub-button" onClick={handleAddSubItem}>
            <FaPlus />
            </button>
            <button className="delete-button" onClick={() => onDelete(item.id)}>
            <FaTrash />
            </button>
        </div>
        {isExpanded && (
            <ul className="sub-items">
            {item.subItems.map((subItem) => (
                <li key={subItem.id} className="sub-item">
                <input
                    type="checkbox"
                    checked={subItem.completed}
                    onChange={() => onToggle(item.id, subItem.id)}
                />
                <input
                    type="text"
                    value={subItem.text}
                    onChange={(e) => onEdit(item.id, subItem.id, e.target.value)}
                    className={subItem.completed ? 'completed' : ''}
                />
                <button className="delete-button" onClick={() => onDelete(item.id, subItem.id)}>
                    <FaTrash />
                </button>
                </li>
            ))}
            </ul>
        )}
        </li>
    );
    };

    ChecklistItem.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
        completed: PropTypes.bool.isRequired,
        subItems: PropTypes.array.isRequired
    }).isRequired,
    onToggle: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onAddSubItem: PropTypes.func.isRequired
    };

    const TravelChecklist = ({ tripId }) => {
    const [items, setItems] = useSessionStorage(`checklist-${tripId}`, []);
    const [newItemText, setNewItemText] = useState('');

    const addItem = (e) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        const newItem = {
        id: Date.now(),
        text: newItemText,
        completed: false,
        subItems: []
        };
        setItems([...items, newItem]);
        setNewItemText('');
    };

    const toggleItem = (id, subId = null) => {
        setItems(items.map(item => {
        if (item.id === id) {
            if (subId) {
            return {
                ...item,
                subItems: item.subItems.map(subItem =>
                subItem.id === subId ? { ...subItem, completed: !subItem.completed } : subItem
                )
            };
            }
            return { ...item, completed: !item.completed };
        }
        return item;
        }));
    };

    const deleteItem = (id, subId = null) => {
        if (subId) {
        setItems(items.map(item =>
            item.id === id ? { ...item, subItems: item.subItems.filter(subItem => subItem.id !== subId) } : item
        ));
        } else {
        setItems(items.filter(item => item.id !== id));
        }
    };

    const editItem = (id, subId, text) => {
        setItems(items.map(item => {
        if (item.id === id) {
            if (subId) {
            return {
                ...item,
                subItems: item.subItems.map(subItem =>
                subItem.id === subId ? { ...subItem, text } : subItem
                )
            };
            }
            return { ...item, text };
        }
        return item;
        }));
    };

    const addSubItem = (parentId) => {
        setItems(items.map(item => {
        if (item.id === parentId) {
            const newSubItem = {
            id: Date.now() + Math.random(),
            text: '',
            completed: false
            };
            return { ...item, subItems: [...item.subItems, newSubItem] };
        }
        return item;
        }));
    };

    return (
        <div className="travel-checklist">
        <h3>Travel Checklist</h3>
        <form onSubmit={addItem} className="add-item-form">
            <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new item"
            />
            <button type="submit" className="add-button">
            <FaPlus />
            </button>
        </form>
        <ul className="checklist">
            {items.map(item => (
            <ChecklistItem
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onDelete={deleteItem}
                onEdit={editItem}
                onAddSubItem={addSubItem}
            />
            ))}
        </ul>
        </div>
    );
};

TravelChecklist.propTypes = {
    tripId: PropTypes.string.isRequired
};

export default TravelChecklist;

