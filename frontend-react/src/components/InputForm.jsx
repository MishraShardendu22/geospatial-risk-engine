const defaultState = {
  latitude: "",
  longitude: "",
  surveyNumber: "",
  villageId: "",
  pincode: "",
  surveyType: "parcel",
};

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function InputForm({ onSubmit, loading, form, onFormChange }) {
  const currentForm = {
    ...defaultState,
    ...(form || {}),
  };

  function setValue(key, value) {
    onFormChange(key, value);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      surveyNumber: currentForm.surveyNumber || undefined,
      villageId: currentForm.villageId || undefined,
      pincode: currentForm.pincode || undefined,
      surveyType: currentForm.surveyType || undefined,
      latitude: parseOptionalNumber(currentForm.latitude),
      longitude: parseOptionalNumber(currentForm.longitude),
    };

    onSubmit(payload);
  }

  return (
    <form className="card input-form" onSubmit={handleSubmit}>
      <h2>Land Risk Input</h2>
      <p className="muted">Provide either lat/lon or survey + village inputs.</p>

      <div className="grid two">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            value={currentForm.latitude}
            onChange={(e) => setValue("latitude", e.target.value)}
            placeholder="12.9716"
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            value={currentForm.longitude}
            onChange={(e) => setValue("longitude", e.target.value)}
            placeholder="77.5946"
          />
        </label>
      </div>

      <div className="grid three">
        <label>
          Survey Number
          <input
            type="text"
            value={currentForm.surveyNumber}
            onChange={(e) => setValue("surveyNumber", e.target.value)}
            placeholder="12/3"
          />
        </label>
        <label>
          Village ID
          <input
            type="text"
            value={currentForm.villageId}
            onChange={(e) => setValue("villageId", e.target.value)}
            placeholder="301001"
          />
        </label>
        <label>
          Pincode
          <input
            type="text"
            value={currentForm.pincode}
            onChange={(e) => setValue("pincode", e.target.value)}
            placeholder="560001"
          />
        </label>
      </div>

      <label>
        Survey Type
        <select
          value={currentForm.surveyType}
          onChange={(e) => setValue("surveyType", e.target.value)}
        >
          <option value="parcel">Parcel</option>
          <option value="plot">Plot</option>
          <option value="land">Land</option>
        </select>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Run Risk Assessment"}
      </button>
    </form>
  );
}
