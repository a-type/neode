import {
    DIRECTION_IN,
    DIRECTION_OUT
} from '../RelationshipType';
import Relationship from '../Relationship';

import GenerateDefaultValues from './GenerateDefaultValues';
import Validator from './Validator';

export default function RelateTo(neode, from, to, relationship, properties) {
    return GenerateDefaultValues(neode, relationship, properties)
        .then(properties => Validator(neode, relationship, properties))
        .then(properties => {
            const direction_in = relationship.direction() == DIRECTION_IN ? '<' : '';
            const direction_out = relationship.direction() == DIRECTION_OUT ? '>' : '';
            const type = relationship.relationship();

            let params = {
                from_id: from.idInt(),
                to_id: to.idInt()
            };
            let set = '';

            if ( Object.keys(properties).length ) {
                set += 'SET ';
                set += Object.keys(properties).map(key => {
                    params[`set_${key}`] = properties[ key ];
                    return `rel.${key} = {set_${key}}`;
                }).join(', ');
            }

            const query = `
                MATCH (from), (to)
                WHERE id(from) = {from_id}
                AND id(to) = {to_id}
                CREATE (from)${direction_in}-[rel:${type}]-${direction_out}(to)
                ${set}
                RETURN rel
            `;

            return neode.cypher(query, params)
                .then(res => {
                    const rel = res.records[0].get('rel');
                    const hydrate_from = relationship.direction() == DIRECTION_IN ? to : from;
                    const hydrate_to = relationship.direction() == DIRECTION_IN ? from : to;

                    return new Relationship(neode, relationship, rel, hydrate_from, hydrate_to);
                });
        });
}