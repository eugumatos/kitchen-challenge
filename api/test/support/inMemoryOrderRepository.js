// Test double that honours the orderRepository contract with plain objects (no Sequelize).
function createInMemoryOrderRepository(seed = []) {
  const rows = new Map(seed.map((o) => [o.id, structuredClone(o)]));
  const copy = (o) => structuredClone(o);

  return {
    rows,
    async findByStatuses(statuses) {
      return [...rows.values()].filter((o) => statuses.includes(o.status)).map(copy);
    },
    async findById(id) {
      return rows.has(id) ? copy(rows.get(id)) : null;
    },
    async updateStatusIf(id, from, to) {
      const row = rows.get(id);
      if (!row || row.status !== from) return false;
      row.status = to;
      return true;
    },
  };
}

module.exports = { createInMemoryOrderRepository };
