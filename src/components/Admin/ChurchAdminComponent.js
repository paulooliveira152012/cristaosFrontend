import { useState } from "react";
import { useChurchesAdmin } from "./functions/ChurchesFunctions";
import "../../styles/Admin.css";

export const ChurchesAdmin = () => {
  const {
    list,
    loading,
    error,
    selected,
    form,
    saving,
    uploading,
    onChange,
    startCreate,
    startEdit,
    handleUploadImage,
    handleUploadPdf,
    handleUploadPhotoToGallery,
    removePhoto,
    submit,
    removeChurch,
  } = useChurchesAdmin();

  const [selectedTab, setSelectedTab] = useState("");

  const API = process.env.REACT_APP_API_BASE_URL;

  return (
    <div className="adminPage grid md:grid-cols-2 gap-4">
      <select className="fwSellect" onChange={(e) => setSelectedTab(e.target.value)}>
        {/* default */}
        <option value="">Selecionar uma opção</option>
        <option value="new" onSelect={() => setSelectedTab("new")}>Registrar Igreja</option>
        <option value="edit" onSelect={() => setSelectedTab("edit")}>Editar Igreja</option>
      </select>

      {selectedTab === "new" && (
        <div>
          {/* Formulário para registrar nova igreja */}

          {/* Coluna formulário */}
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">
                {selected ? "Editar igreja" : "Nova igreja"}
              </h2>
              {selected && (
                <button className="text-sm underline" onClick={startCreate}>
                  cancelar edição
                </button>
              )}
            </div>

            <form className="grid gap-2" onSubmit={submit}>
              {/* Básicos */}
              <input
                name="name"
                placeholder="Nome *"
                value={form.name}
                onChange={onChange}
                required
                className="border p-2 rounded"
              />
              <input
                name="summary"
                placeholder="Resumo"
                value={form.summary}
                onChange={onChange}
                className="border p-2 rounded"
              />
              <input
                name="website"
                placeholder="Website"
                value={form.website}
                onChange={onChange}
                className="border p-2 rounded"
              />
              <input
                name="address"
                placeholder="Endereço"
                value={form.address}
                onChange={onChange}
                className="border p-2 rounded"
              />
              <input
                name="denomination"
                placeholder="Denominação"
                value={form.denomination}
                onChange={onChange}
                className="border p-2 rounded"
              />
              <input
                name="meetingTimes"
                placeholder="Horários (separe por vírgula)"
                value={form.meetingTimes}
                onChange={onChange}
                className="border p-2 rounded"
              />

              {/* Upload capa */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Imagem de capa (URL ou upload)
                </label>
                <div className="flex gap-2">
                  <input
                    name="imageUrl"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={onChange}
                    className="border p-2 rounded flex-1"
                  />
                  <label className="px-3 py-2 rounded bg-gray-200 cursor-pointer">
                    {uploading ? "Enviando..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="capa"
                    style={{ maxWidth: 240, borderRadius: 8 }}
                  />
                )}
              </div>

              {/* Galeria */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Galeria de fotos</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded bg-gray-200 cursor-pointer">
                    {uploading ? "Enviando..." : "Adicionar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhotoToGallery}
                      className="hidden"
                    />
                  </label>
                </div>
                {!!form.photos?.length && (
                  <div className="flex flex-wrap gap-2">
                    {form.photos.map((u) => (
                      <div key={u} className="relative">
                        <img
                          src={u}
                          alt=""
                          style={{
                            width: 88,
                            height: 88,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #eee",
                          }}
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6"
                          onClick={() => removePhoto(u)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Statement / Estatuto */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Estatuto/Statement (PDF)
                </label>
                <div className="flex gap-2">
                  <input
                    name="statementPdf"
                    placeholder="https://..."
                    value={form.statementPdf}
                    onChange={onChange}
                    className="border p-2 rounded flex-1"
                  />
                  <label className="px-3 py-2 rounded bg-gray-200 cursor-pointer">
                    {uploading ? "Enviando..." : "Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleUploadPdf}
                      className="hidden"
                    />
                  </label>
                </div>
                {form.statementPdf && (
                  <a
                    href={form.statementPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-sm"
                  >
                    ver PDF
                  </a>
                )}
              </div>

              {/* Visão / Missão */}
              <textarea
                name="vision"
                placeholder="Visão"
                value={form.vision}
                onChange={onChange}
                className="border p-2 rounded"
                rows={2}
              />
              <textarea
                name="mission"
                placeholder="Missão"
                value={form.mission}
                onChange={onChange}
                className="border p-2 rounded"
                rows={2}
              />

              {/* Contatos */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="phone"
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <input
                  name="whatsapp"
                  placeholder="WhatsApp"
                  value={form.whatsapp}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <input
                  name="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <input
                  name="instagram"
                  placeholder="Instagram (URL)"
                  value={form.instagram}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <input
                  name="youtube"
                  placeholder="YouTube (URL)"
                  value={form.youtube}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
              </div>

              {/* Doações */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Ofertas & Doações</label>
                <input
                  name="giving_pix"
                  placeholder="PIX"
                  value={form.giving_pix}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <div className="grid grid-cols-4 gap-2">
                  <input
                    name="giving_bank_bank"
                    placeholder="Banco"
                    value={form.giving_bank_bank}
                    onChange={onChange}
                    className="border p-2 rounded"
                  />
                  <input
                    name="giving_bank_agency"
                    placeholder="Agência"
                    value={form.giving_bank_agency}
                    onChange={onChange}
                    className="border p-2 rounded"
                  />
                  <input
                    name="giving_bank_account"
                    placeholder="Conta"
                    value={form.giving_bank_account}
                    onChange={onChange}
                    className="border p-2 rounded"
                  />
                  <input
                    name="giving_bank_type"
                    placeholder="Tipo (CC/CP)"
                    value={form.giving_bank_type}
                    onChange={onChange}
                    className="border p-2 rounded"
                  />
                </div>
              </div>

              {/* Ministérios / Liderança */}
              <textarea
                name="ministries"
                placeholder='Ministérios (ex: "Kids|Ministério infantil; Youth|Encontros")'
                value={form.ministries}
                onChange={onChange}
                className="border p-2 rounded"
                rows={2}
              />
              <textarea
                name="leadership"
                placeholder='Liderança (ex: "Pastor Principal|Fulano; Pastora|Ciclana")'
                value={form.leadership}
                onChange={onChange}
                className="border p-2 rounded"
                rows={2}
              />

              {/* Coordenadas */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="lng"
                  placeholder="Longitude (ex: -46.63)"
                  value={form.lng}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
                <input
                  name="lat"
                  placeholder="Latitude (ex: -23.55)"
                  value={form.lat}
                  onChange={onChange}
                  className="border p-2 rounded"
                />
              </div>

              <button
                disabled={saving}
                className={`mt-2 px-4 py-2 rounded text-white ${
                  saving ? "bg-gray-400" : "bg-black"
                }`}
              >
                {selected
                  ? saving
                    ? "Salvando..."
                    : "Salvar alterações"
                  : saving
                  ? "Criando..."
                  : "Criar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedTab === "edit" && (
        <div>
          <h3>Editar Igreja</h3>
          {/* Formulário para editar igreja */}
          {/* Coluna lista */}
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">Igrejas registradas</h2>
              <a
                className="text-sm underline"
                href={`${API}/api/churches/geojson`}
                target="_blank"
                rel="noreferrer"
              >
                ver GeoJSON
              </a>
            </div>

            {loading && <p>Carregando...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
              <div className="overflow-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Denom.</th>
                      <th className="text-left p-2">Membros</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((c) => (
                      <tr key={c._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{c.name}</td>
                        <td className="p-2">{c.denomination || "-"}</td>
                        <td className="p-2">{c.membersCount ?? 0}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              className="px-2 py-1 rounded bg-gray-200"
                              onClick={() => startEdit(c)}
                            >
                              Editar
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-gray-200"
                              onClick={() =>
                                alert("Abrir gerenciador de membros")
                              }
                            >
                              Gerenciar membros
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-red-600 text-white"
                              onClick={() => removeChurch(c._id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!list.length && (
                      <tr>
                        <td className="p-2" colSpan={4}>
                          Nenhuma igreja cadastrada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
