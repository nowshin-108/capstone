function ManageSection() {
    return (
        <>
        <h2>&nbsp;Manage</h2>
        <div className="manage-section">
        <ul>
            <li>
            <div className="item-info">
                <span className="item-title">Travel Docs</span>
                <span className="item-subtitle">Check List Completed</span>
            </div>
            <div className="icons">
                <span className="check">✓</span>
                <span className="edit">✎</span>
            </div>
            </li>
            <li>
            <div className="item-info">
                <span className="item-title">Boarding Pass</span>
                <span className="item-subtitle">Boarding Pass Added</span>
            </div>
            <div className="icons">
                <span className="check">✓</span>
                <span className="edit">✎</span>
            </div>
            </li>
            <li>
            <div className="item-info">
                <span className="item-title">Airline</span>
                <span className="item-subtitle">Emirates</span>
            </div>
            <div className="icons">
                <span className="edit">✎</span>
            </div>
            </li>
        </ul>
        </div>
        </>
    );
    }

export default ManageSection;
