function ManageSection() {
    return (
        <div className="manage-section">
        <h2>Manage</h2>
        <ul>
            <li>
            <div className="item-info">
                <span className="item-title">Travel Docs</span>
                <span className="item-subtitle">Check List</span>
            </div>
            <div className="icons">
                <span className="check">✓</span>
                <span className="edit">✎</span>
            </div>
            </li>
            <li>
            <div className="item-info">
                <span className="item-title">Boarding Pass</span>
                <span className="item-subtitle">If this, then that</span>
            </div>
            <div className="icons">
                <span className="check">✓</span>
                <span className="edit">✎</span>
            </div>
            </li>
            <li>
            <div className="item-info">
                <span className="item-title">Airline</span>
                <span className="item-subtitle">If this, then do thi...</span>
            </div>
            <div className="icons">
                <span className="edit">✎</span>
            </div>
            </li>
        </ul>
        </div>
    );
    }

export default ManageSection;
